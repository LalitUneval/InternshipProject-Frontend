import {
  Component, OnInit, OnDestroy, inject,
  ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ProfileModal } from '../../components/profile-modal/profile-modal';
import { ProfileService, UserProfileResponse } from '../../services/profile.service';
import {
  RelocationService, ServiceProvider, ProviderApplication,
  CreateProviderPayload, UpdateProviderPayload, ServiceType,
} from '../../services/relocation.service';
import { VerifiedCountPipe } from '../../pipes/verified-count-pipe';

type AdminSection = 'overview' | 'providers' | 'applications' | 'userDetails';





export interface UserDto {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModal, RouterLink, VerifiedCountPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private relocationSvc = inject(RelocationService);
  private cdr = inject(ChangeDetectorRef);
  private el = inject(ElementRef);
  private ngZone = inject(NgZone);
  private http = inject(HttpClient);

  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  displayName = localStorage.getItem('userRole') || 'Admin';
  showProfileBanner = false;
  isDarkMode = false;
  profileOpen = false;
  showProfileModal = false;
  isEditMode = false;
  existingProfile: UserProfileResponse | null = null;
  activeSection: AdminSection = 'overview';

  // Providers 
  providers: ServiceProvider[] = [];
  providersLoading = false;
  providersLoaded = false;
  showAddModal = false;
  showEditModal = false;
  editingProvider: ServiceProvider | null = null;
  providerForm: CreateProviderPayload = this.emptyProviderForm();
  editForm: UpdateProviderPayload = {};
  formLoading = false; formError = ''; formSuccess = '';

  // Applications
  applications: ProviderApplication[] = [];
  applicationsLoading = false;
  applicationsLoaded = false;
  reviewNoteModal = false;
  reviewAction: 'approve' | 'reject' | null = null;
  reviewingApp: ProviderApplication | null = null;
  reviewNote = ''; reviewLoading = false;

  // User Details
  users: UserDto[] = [];
  usersLoading = false;
  usersLoaded = false;
  userActionLoading: { [userId: number]: boolean } = {};

  // Pagination
  usersPage = 0;
  usersPageSize = 20;
  usersTotalPages = 0;
  usersTotalElements = 0;

  // Search
  searchName = '';
  searchResults: UserProfileResponse[] = [];
  searchLoading = false;
  searchError = '';
  isSearchMode = false;

  private readonly AUTH_BASE = environment.authApi;
  private readonly SEARCH_BASE = environment.usersApi;

  get pendingCount(): number {
    return this.applications.filter(a => a.status === 'PENDING').length;
  }

  get adminId(): number {
    return Number(localStorage.getItem('userId') ?? 0);
  }

  readonly serviceTypes: ServiceType[] = [
    'VISA_ASSISTANCE', 'AIRPORT_PICKUP', 'FURNITURE_RENTAL',
    'MOVING_SERVICE', 'LEGAL_CONSULTATION', 'DOCUMENT_TRANSLATION',
  ];

  readonly serviceTypeLabels: Record<ServiceType, string> = {
    VISA_ASSISTANCE: 'Visa Assistance', AIRPORT_PICKUP: 'Airport Pickup',
    FURNITURE_RENTAL: 'Furniture Rental', MOVING_SERVICE: 'Moving Service',
    LEGAL_CONSULTATION: 'Legal Consultation', DOCUMENT_TRANSLATION: 'Document Translation',
  };

  // Lifecycle

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();

    const done = localStorage.getItem('profileComplete');
    const name = localStorage.getItem('displayName');
    if (done === 'true' && name) {
      this.displayName = name;
      this.showProfileBanner = false;
      this.cdr.markForCheck();
    } else {
      this.fetchProfile();
    }

    this.loadProviders();
    this.loadApplications();

    // Debounce search: wait 400ms after user stops typing
    this.searchInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(name => this.executeSearch(name));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Get profile function
  fetchProfile() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.existingProfile = profile;
        this.displayName = profile.fullName;
        this.showProfileBanner = false;
        localStorage.setItem('profileComplete', 'true');
        localStorage.setItem('displayName', profile.fullName);
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 404) {
          this.existingProfile = null;
          this.showProfileBanner = true;
          localStorage.removeItem('profileComplete');
          this.cdr.markForCheck();
        }
      },
    });
  }


  // Navigation
  switchSection(section: AdminSection) {
    this.activeSection = section;
    this.cdr.markForCheck();
    if (section === 'providers') {
      this.providersLoaded = false;
      this.loadProviders();
    }
    if (section === 'applications') {
      this.applicationsLoaded = false;
      this.loadApplications();
    }
    if (section === 'userDetails' && !this.usersLoaded) {
      this.loadUsers();
    }
  }

  // Get providers

  loadProviders() {
    this.providersLoading = true;
    this.cdr.markForCheck();
    this.relocationSvc.getAllProviders().subscribe({
      next: (data) => { this.providers = data; this.providersLoading = false; this.providersLoaded = true; this.cdr.markForCheck(); },
      error: () => { this.providersLoading = false; this.cdr.markForCheck(); },
    });
  }



  openAddModal() { this.providerForm = this.emptyProviderForm(); this.formError = ''; this.formSuccess = ''; this.showAddModal = true; this.cdr.markForCheck(); }

  submitAddProvider() {
    this.formLoading = true; this.formError = ''; this.cdr.markForCheck();
    this.relocationSvc.createProvider(this.providerForm).subscribe({
      next: (p) => {
        this.providers = [p, ...this.providers]; this.formLoading = false; this.showAddModal = false;
        this.formSuccess = `"${p.name}" added successfully!`; this.cdr.markForCheck();
        setTimeout(() => { this.formSuccess = ''; this.cdr.markForCheck(); }, 3000);
      },
      error: (err) => { this.formLoading = false; this.formError = err.error?.message || 'Failed to add provider.'; this.cdr.markForCheck(); },
    });
  }

  openEditModal(provider: ServiceProvider) {
    this.editingProvider = provider;
    this.editForm = { contactNumber: provider.contactNumber || '', email: provider.email || '', description: provider.description || '', isVerified: provider.isVerified };
    this.formError = ''; this.showEditModal = true; this.cdr.markForCheck();
  }

  submitEditProvider() {
    if (!this.editingProvider) return;
    this.formLoading = true; this.formError = ''; this.cdr.markForCheck();
    this.relocationSvc.updateProvider(this.editingProvider.id, this.editForm).subscribe({
      next: (updated) => { this.providers = this.providers.map(p => p.id === updated.id ? updated : p); this.formLoading = false; this.showEditModal = false; this.cdr.markForCheck(); },
      error: (err) => { this.formLoading = false; this.formError = err.error?.message || 'Failed to update.'; this.cdr.markForCheck(); },
    });
  }

  toggleVerified(provider: ServiceProvider) {
    this.relocationSvc.updateProvider(provider.id, { isVerified: !provider.isVerified }).subscribe({
      next: (updated) => { this.providers = this.providers.map(p => p.id === updated.id ? updated : p); this.cdr.markForCheck(); },
      error: (err) => alert(err.error?.message || 'Failed to update provider.'),
    });
  }

  deleteProvider(provider: ServiceProvider) {
    if (!confirm(`Delete "${provider.name}"? This cannot be undone.`)) return;
    this.relocationSvc.deleteProvider(provider.id).subscribe({
      next: () => { this.providers = this.providers.filter(p => p.id !== provider.id); this.cdr.markForCheck(); },
      error: (err) => alert(err.error?.message || 'Failed to delete provider.'),
    });
  }

  // Get Application 

  loadApplications() {
    this.applicationsLoading = true; this.cdr.markForCheck();
    this.relocationSvc.getAllApplications().subscribe({
      next: (data) => { this.applications = data; this.applicationsLoading = false; this.applicationsLoaded = true; this.cdr.markForCheck(); },
      error: () => { this.applicationsLoading = false; this.cdr.markForCheck(); },
    });
  }


  openReviewModal(app: ProviderApplication, action: 'approve' | 'reject') {
    this.reviewingApp = app; this.reviewAction = action; this.reviewNote = ''; this.reviewNoteModal = true; this.cdr.markForCheck();
  }


  // Approve / Reject request 
  submitReview() {
    if (!this.reviewingApp || !this.reviewAction) return;
    this.reviewLoading = true; this.cdr.markForCheck();
    const obs = this.reviewAction === 'approve'
      ? this.relocationSvc.approveApplication(this.reviewingApp.id, this.reviewNote || undefined)
      : this.relocationSvc.rejectApplication(this.reviewingApp.id, this.reviewNote || undefined);
    obs.subscribe({
      next: (updated) => {
        this.applications = this.applications.map(a => a.id === updated.id ? updated : a);
        if (this.reviewAction === 'approve') { this.providersLoaded = false; this.loadProviders(); }
        this.reviewLoading = false; this.reviewNoteModal = false; this.cdr.markForCheck();
      },
      error: (err) => { this.reviewLoading = false; this.cdr.markForCheck(); alert(err.error?.message || 'Action failed.'); },
    });
  }


  // User Details

  // Add this property
  private activeStateOverrides = new Map<number, boolean>();

  loadUsers(page = 0) {
    this.usersLoading = true; this.cdr.markForCheck();
    const params = new HttpParams()
      .set('adminId', this.adminId)
      .set('page', page)
      .set('size', this.usersPageSize);

    this.http.get<PageResponse<UserDto>>(`${this.AUTH_BASE}/admin/users`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.users = page.content;
          this.usersPage = page.number;
          this.usersTotalPages = page.totalPages;
          this.usersTotalElements = page.totalElements;
          this.usersLoading = false;
          this.usersLoaded = true;
          this.cdr.markForCheck();
        },
        error: () => { this.usersLoading = false; this.cdr.markForCheck(); },
      });
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.usersTotalPages) return;
    this.loadUsers(page);
  }


  onSearchInput(value: string) {
    this.searchName = value;
    if (!value.trim()) {
      this.isSearchMode = false;
      this.searchResults = [];
      this.searchError = '';
      this.cdr.markForCheck();
      return;
    }
    this.searchInput$.next(value.trim());
  }

  clearSearch() {
    this.searchName = '';
    this.isSearchMode = false;
    this.searchResults = [];
    this.searchError = '';
    this.cdr.markForCheck();
  }

  private executeSearch(name: string) {
    this.searchLoading = true; this.searchError = ''; this.isSearchMode = true;
    this.cdr.markForCheck();
    const params = new HttpParams().set('name', name);
    this.http.get<UserProfileResponse[]>(`${this.SEARCH_BASE}/search`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => { this.searchResults = results; this.searchLoading = false; this.cdr.markForCheck(); },
        error: () => { this.searchError = 'Search failed. Please try again.'; this.searchLoading = false; this.cdr.markForCheck(); },
      });
  }

  // Activate user — works with both paginated list and search result
  activateUser(userId: number) {
    this.userActionLoading[userId] = true; this.cdr.markForCheck();
    const params = new HttpParams().set('adminId', this.adminId);
    this.http.patch(`${this.AUTH_BASE}/admin/activate/${userId}`, null, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.userActionLoading[userId] = false;
          // Update local state optimistically in the right list
          this.updateUserActiveState(userId, true);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.userActionLoading[userId] = false;
          alert(err.error?.message || 'Failed to activate user.');
          this.cdr.markForCheck();
        },
      });
  }

  // Deactivate user
  deactivateUser(userId: number) {
    this.userActionLoading[userId] = true; this.cdr.markForCheck();
    const params = new HttpParams().set('adminId', this.adminId);
    this.http.patch(`${this.AUTH_BASE}/admin/deactivate/${userId}`, null, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.userActionLoading[userId] = false;
          this.updateUserActiveState(userId, false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.userActionLoading[userId] = false;
          alert(err.error?.message || 'Failed to deactivate user.');
          this.cdr.markForCheck();
        },
      });
  }



  private updateUserActiveState(userId: number, active: boolean) {
    this.users = this.users.map(u =>
      u.id === userId ? { ...u, isActive: active } : u
    );
    // Also cache for search results
    this.activeStateOverrides.set(userId, active);
  }

  getUserActive(userId: number): boolean {
    if (this.activeStateOverrides.has(userId)) {
      return this.activeStateOverrides.get(userId)!;
    }
    const cached = this.users.find(u => u.id === userId);
    return cached?.isActive ?? true;
  }

  // Helpers

  labelOf(type: ServiceType): string { return this.serviceTypeLabels[type] ?? type; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'status-confirmed', COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled', APPROVED: 'status-completed', REJECTED: 'status-cancelled',
    };
    return map[status] ?? 'status-pending';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  emptyProviderForm(): CreateProviderPayload {
    return { name: '', serviceType: 'VISA_ASSISTANCE', city: '', contactNumber: '', email: '', description: '', isVerified: false };
  }

  openCreateProfile() { this.isEditMode = false; this.showProfileModal = true; this.cdr.markForCheck(); }
  openEditProfile() { this.isEditMode = true; this.showProfileModal = true; this.cdr.markForCheck(); }
  closeProfileModal() { this.showProfileModal = false; this.cdr.markForCheck(); }
  onProfileSaved() { this.showProfileModal = false; this.fetchProfile(); }

  logout() {
    ['accessToken', 'refreshToken', 'profileComplete', 'displayName', 'userId', 'userRole']
      .forEach(k => localStorage.removeItem(k));
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.ngZone.run(() => {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
      this.cdr.markForCheck();
    });
  }

  toggleProfile() { this.profileOpen = !this.profileOpen; this.cdr.markForCheck(); }

  applyTheme() {
    if (this.isDarkMode) {
      this.el.nativeElement.setAttribute('data-theme', 'dark');  
    } else {
      this.el.nativeElement.removeAttribute('data-theme');      
    }
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  get pageRange(): number[] {
    const total = this.usersTotalPages;
    const cur = this.usersPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, cur - delta); i <= Math.min(total - 1, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }


}