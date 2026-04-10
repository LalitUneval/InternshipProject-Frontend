import {
  Component, OnInit, inject,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RelocationService, ServiceProvider, ServiceBooking,
  ProviderApplication, CreateApplicationPayload,
  CreateProviderPayload, UpdateProviderPayload,
  CreateBookingPayload, ServiceType, SearchParams,
} from '../../services/relocation.service';

type Tab = 'browse' | 'myBookings' | 'applyProvider' | 'providerDashboard' | 'adminProviders' | 'adminBookings';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.html',
  styleUrl: './services.css',
  changeDetection: ChangeDetectionStrategy.OnPush,  
})
export class Services implements OnInit {

  private svc = inject(RelocationService);
  private cdr = inject(ChangeDetectorRef);

  userId   = Number(localStorage.getItem('userId') || '0');
  userRole = localStorage.getItem('userRole') || '';
  get isAdmin(): boolean    { return this.userRole === 'ADMIN'; }

  activeTab: Tab = 'browse';

  //  Provider ownership 
  myProviderId: number | null = null;
  get isProvider(): boolean { return this.myProviderId !== null; }

  //  Browse 
  providers: ServiceProvider[] = [];
  loadingProviders = false;
  searchCity = ''; searchType: ServiceType | '' = ''; searchVerified = '';
  selectedProvider: ServiceProvider | null = null;
  showBookForm = false; bookDate = ''; bookNotes = '';
  bookLoading = false; bookSuccess = ''; bookError = '';

  //  My Bookings 
  myBookings: ServiceBooking[] = [];
  myBookingsLoading = false; myBookingsLoaded = false; myBookingsError = '';
  showRatingModal = false; ratingBookingId = 0; rating = 5;

  //  Apply as Provider 
  applyForm: CreateApplicationPayload = this.emptyApplyForm();
  applyLoading = false; applySuccess = ''; applyError = '';
  myApplications: ProviderApplication[] = [];
  myApplicationsLoading = false; myApplicationsLoaded = false;

  // Provider Dashboard 
  providerBookings: ServiceBooking[] = [];
  providerBookingsLoading = false; providerBookingsLoaded = false;

  //  Admin: Providers 
  adminProviders: ServiceProvider[] = [];
  adminProvidersLoading = false; adminProvidersLoaded = false;
  showAddModal = false; showEditModal = false;
  editingProvider: ServiceProvider | null = null;
  providerForm: CreateProviderPayload = this.emptyProviderForm();
  editForm: UpdateProviderPayload = {};
  formLoading = false; formError = ''; formSuccess = '';

  //  Admin: Bookings 
  adminBookings: ServiceBooking[] = [];
  adminBookingsLoading = false; adminBookingsLoaded = false;

  readonly serviceTypes: ServiceType[] = [
    'VISA_ASSISTANCE','AIRPORT_PICKUP','FURNITURE_RENTAL',
    'MOVING_SERVICE','LEGAL_CONSULTATION','DOCUMENT_TRANSLATION',
  ];

  readonly serviceTypeLabels: Record<ServiceType, string> = {
    VISA_ASSISTANCE:'Visa Assistance', AIRPORT_PICKUP:'Airport Pickup',
    FURNITURE_RENTAL:'Furniture Rental', MOVING_SERVICE:'Moving Service',
    LEGAL_CONSULTATION:'Legal Consultation', DOCUMENT_TRANSLATION:'Document Translation',
  };

  readonly serviceTypeIcons: Record<ServiceType, string> = {
    VISA_ASSISTANCE:'📋', AIRPORT_PICKUP:'✈️', FURNITURE_RENTAL:'🛋️',
    MOVING_SERVICE:'📦', LEGAL_CONSULTATION:'⚖️', DOCUMENT_TRANSLATION:'📄',
  };

  ngOnInit(): void {
    this.loadProviders();
    this.checkIfProvider();
  }

  checkIfProvider(): void {
    this.svc.getMyProviderId(this.userId).subscribe({
      next: (id) => { this.myProviderId = id; this.cdr.markForCheck(); },  
      error: ()  => { this.myProviderId = null; },
    });
  }

  //  Tab switching 
  switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.cdr.markForCheck();  

    // Always re-fetch incoming tabs for freshness
    if (tab === 'myBookings') {
      this.myBookingsLoaded = false;
      this.loadMyBookings();
    }
    if (tab === 'applyProvider' && !this.myApplicationsLoaded) {
      this.loadMyApplications();
    }
    if (tab === 'providerDashboard') {
      this.providerBookingsLoaded = false;
      this.loadProviderBookings();
    }
    if (tab === 'adminProviders') {
      this.adminProvidersLoaded = false;
      this.loadAdminProviders();
    }
    if (tab === 'adminBookings') {
      this.adminBookingsLoaded = false;
      this.loadAdminBookings();
    }
  }

  //  Browse 
  loadProviders(): void {
    this.loadingProviders = true;
    this.cdr.markForCheck();  
    this.svc.getAllProviders().subscribe({
      next: (data) => {
        this.providers        = data;
        this.loadingProviders = false;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.loadingProviders = false;
        this.cdr.markForCheck();  
      },
    });
  }

  searchProviders(): void {
    this.loadingProviders = true;
    this.cdr.markForCheck();  
    const params: SearchParams = {
      city:        this.searchCity     || undefined,
      serviceType: this.searchType     || undefined,
      isVerified:  this.searchVerified === '' ? undefined : this.searchVerified === 'true',
    };
    this.svc.searchProviders(params).subscribe({
      next: (data) => {
        this.providers        = data;
        this.loadingProviders = false;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.providers        = [];
        this.loadingProviders = false;
        this.cdr.markForCheck();  
      },
    });
  }

  clearSearch(): void {
    this.searchCity = ''; this.searchType = ''; this.searchVerified = '';
    this.loadProviders();
  }

  openDetail(provider: ServiceProvider): void {
    this.selectedProvider = provider;
    this.showBookForm     = false;
    this.bookDate = ''; this.bookNotes = '';
    this.bookSuccess = ''; this.bookError = '';
    this.cdr.markForCheck();  
  }

  closeDetail(): void {
    this.selectedProvider = null;
    this.showBookForm     = false;
    this.cdr.markForCheck();  
  }

  openBookForm(): void {
    this.showBookForm = true;
    this.cdr.markForCheck();  
  }

  submitBooking(): void {
    if (!this.selectedProvider || !this.bookDate) return;

    if (this.selectedProvider.ownerUserId === this.userId) {
      this.bookError = 'You cannot book your own service.';
      this.cdr.markForCheck();  
      return;
    }

    this.bookLoading = true; this.bookSuccess = ''; this.bookError = '';
    this.cdr.markForCheck();  

    const payload: CreateBookingPayload = {
      bookingDate: new Date(this.bookDate).toISOString(),
      notes:       this.bookNotes || undefined,
    };

    this.svc.bookService(this.selectedProvider.id, this.userId, payload).subscribe({
      next: () => {
        this.bookLoading      = false;
        this.bookSuccess      = 'Booking confirmed! You can view it in My Bookings.';
        this.showBookForm     = false;
        this.myBookingsLoaded = false;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.bookLoading = false;
        this.bookError   = err.error?.message || 'Failed to book service.';
        this.cdr.markForCheck();  
      },
    });
  }

  //  My Bookings 
  loadMyBookings(): void {
    this.myBookingsLoading = true; this.myBookingsError = '';
    this.cdr.markForCheck();  
    this.svc.getUserBookings(this.userId).subscribe({
      next: (data) => {
        this.myBookings        = data;
        this.myBookingsLoading = false;
        this.myBookingsLoaded  = true;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.myBookingsLoading = false;
        this.myBookingsLoaded  = true;
        this.myBookings        = [];
        if (err.status !== 404) {
          this.myBookingsError = err.error?.message || 'Failed to load bookings.';
        }
        this.cdr.markForCheck();  
      },
    });
  }

  cancelBooking(bookingId: number): void {
    if (!confirm('Cancel this booking?')) return;
    this.svc.cancelBooking(bookingId, this.userId).subscribe({
      next: () => { this.myBookingsLoaded = false; this.loadMyBookings(); },
      error: (err) => alert(err.error?.message || 'Failed to cancel booking.'),
    });
  }

  openRatingModal(bookingId: number): void {
    this.ratingBookingId = bookingId;
    this.rating          = 5;
    this.showRatingModal = true;
    this.cdr.markForCheck();  
  }

  submitRating(): void {
    this.svc.completeBooking(this.ratingBookingId, this.rating).subscribe({
      next: () => {
        this.showRatingModal  = false;
        this.myBookingsLoaded = false;
        this.loadMyBookings();
        this.cdr.markForCheck();  
      },
      error: (err) => alert(err.error?.message || 'Failed to complete booking.'),
    });
  }

  //  Apply as Provider 
  loadMyApplications(): void {
    this.myApplicationsLoading = true;
    this.cdr.markForCheck();  
    this.svc.getMyApplications(this.userId).subscribe({
      next: (data) => {
        this.myApplications        = data;
        this.myApplicationsLoading = false;
        this.myApplicationsLoaded  = true;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.myApplications        = [];
        this.myApplicationsLoading = false;
        this.myApplicationsLoaded  = true;
        this.cdr.markForCheck();  
      },
    });
  }

  submitApplication(): void {
    this.applyLoading = true; this.applySuccess = ''; this.applyError = '';
    this.cdr.markForCheck();  
    const payload: CreateApplicationPayload = { ...this.applyForm, applicantUserId: this.userId };
    this.svc.submitApplication(payload).subscribe({
      next: (app) => {
        this.applyLoading         = false;
        this.applySuccess         = 'Application submitted! We will review it shortly.';
        this.applyForm            = this.emptyApplyForm();
        this.myApplications       = [app, ...this.myApplications];
        this.myApplicationsLoaded = true;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.applyLoading = false;
        this.applyError   = err.error?.message || 'Failed to submit application.';
        this.cdr.markForCheck();  
      },
    });
  }

  //  Provider Dashboard 
  loadProviderBookings(): void {
    if (!this.myProviderId) return;
    this.providerBookingsLoading = true;
    this.cdr.markForCheck();  
    this.svc.getProviderBookings(this.myProviderId).subscribe({
      next: (data) => {
        this.providerBookings        = data;
        this.providerBookingsLoading = false;
        this.providerBookingsLoaded  = true;
        this.cdr.markForCheck(); 
      },
      error: () => {
        this.providerBookings        = [];
        this.providerBookingsLoading = false;
        this.providerBookingsLoaded  = true;
        this.cdr.markForCheck();
      },
    });
  }

  providerConfirmBooking(bookingId: number): void {
    if (!confirm('Confirm this booking request?')) return;
    this.svc.providerConfirmBooking(bookingId, this.userId).subscribe({
      next: (updated) => {
        this.providerBookings = this.providerBookings.map(b => b.id === updated.id ? updated : b);
        this.cdr.markForCheck();  
      },
      error: (err) => alert(err.error?.message || 'Failed to confirm booking.'),
    });
  }

  //  Admin: Providers 
  loadAdminProviders(): void {
    this.adminProvidersLoading = true;
    this.cdr.markForCheck();  
    this.svc.getAllProviders().subscribe({
      next: (data) => {
        this.adminProviders        = data;
        this.adminProvidersLoading = false;
        this.adminProvidersLoaded  = true;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.adminProvidersLoading = false;
        this.cdr.markForCheck();  
      },
    });
  }

  openAddModal(): void {
    this.providerForm = this.emptyProviderForm();
    this.formError = ''; this.formSuccess = '';
    this.showAddModal = true;
    this.cdr.markForCheck();  
  }

  submitAddProvider(): void {
    this.formLoading = true; this.formError = '';
    this.cdr.markForCheck();  
    this.svc.createProvider(this.providerForm).subscribe({
      next: (p) => {
        this.adminProviders = [p, ...this.adminProviders];
        this.formLoading    = false;
        this.showAddModal   = false;
        this.formSuccess    = `"${p.name}" added successfully!`;
        this.cdr.markForCheck();  
        setTimeout(() => { this.formSuccess = ''; this.cdr.markForCheck(); }, 3000);
      },
      error: (err) => {
        this.formLoading = false;
        this.formError   = err.error?.message || 'Failed to add provider.';
        this.cdr.markForCheck();  
      },
    });
  }

  openEditModal(provider: ServiceProvider): void {
    this.editingProvider = provider;
    this.editForm = {
      contactNumber: provider.contactNumber || '',
      email:         provider.email         || '',
      description:   provider.description   || '',
      isVerified:    provider.isVerified,
    };
    this.formError     = '';
    this.showEditModal = true;
    this.cdr.markForCheck();  
  }

  submitEditProvider(): void {
    if (!this.editingProvider) return;
    this.formLoading = true; this.formError = '';
    this.cdr.markForCheck();  
    this.svc.updateProvider(this.editingProvider.id, this.editForm).subscribe({
      next: (updated) => {
        this.adminProviders = this.adminProviders.map(p => p.id === updated.id ? updated : p);
        this.formLoading    = false;
        this.showEditModal  = false;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.formLoading = false;
        this.formError   = err.error?.message || 'Failed to update provider.';
        this.cdr.markForCheck();  
      },
    });
  }

  deleteProvider(provider: ServiceProvider): void {
    if (!confirm(`Delete "${provider.name}"?`)) return;
    this.svc.deleteProvider(provider.id).subscribe({
      next: () => {
        this.adminProviders = this.adminProviders.filter(p => p.id !== provider.id);
        this.cdr.markForCheck();  
      },
      error: (err) => alert(err.error?.message || 'Failed to delete provider.'),
    });
  }

  //  Admin: Bookings 
  loadAdminBookings(): void {
    this.adminBookingsLoading = true;
    this.cdr.markForCheck();  
    this.svc.getUpcomingBookings(this.userId).subscribe({
      next: (data) => {
        this.adminBookings        = data;
        this.adminBookingsLoading = false;
        this.adminBookingsLoaded  = true;
        this.cdr.markForCheck(); 
      },
      error: () => {
        this.adminBookings        = [];
        this.adminBookingsLoading = false;
        this.adminBookingsLoaded  = true;
        this.cdr.markForCheck(); 
      },
    });
  }

  adminConfirmBooking(bookingId: number): void {
    this.svc.adminConfirmBooking(bookingId).subscribe({
      next: () => { this.adminBookingsLoaded = false; this.loadAdminBookings(); },
      error: (err) => alert(err.error?.message || 'Failed to confirm booking.'),
    });
  }

  //  Helpers 
  emptyApplyForm(): CreateApplicationPayload {
    return { applicantUserId: this.userId, name:'', serviceType:'VISA_ASSISTANCE', city:'', contactNumber:'', email:'', description:'' };
  }

  emptyProviderForm(): CreateProviderPayload {
    return { name:'', serviceType:'VISA_ASSISTANCE', city:'', contactNumber:'', email:'', description:'', isVerified:false };
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED:'status-confirmed', COMPLETED:'status-completed',
      CANCELLED:'status-cancelled', APPROVED:'status-completed', REJECTED:'status-cancelled',
    };
    return map[status] ?? 'status-pending';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit',
    });
  }

  labelOf(type: ServiceType): string { return this.serviceTypeLabels[type] ?? type; }
  iconOf(type: ServiceType): string  { return this.serviceTypeIcons[type]  ?? '🔧'; }
  starsArray(rating: number): number[] { return Array.from({ length: 5 }, (_, i) => i + 1); }
}