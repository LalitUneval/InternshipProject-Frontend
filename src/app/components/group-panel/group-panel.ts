
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, FormGroup, Validators,
} from '@angular/forms';
import { GroupService } from '../../services/group.service';
import {
  CommunityGroup, CreateGroupRequest, GroupMember, UserProfile,
} from '../../models/community.models';

type GroupTab = 'all' | 'joined' | 'pending' | 'rejected';
type AdminTab = 'pending' | 'members';

@Component({
  selector: 'app-group-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './group-panel.html',
  styleUrls: ['./group-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPanel implements OnInit {

  userId   = Number(localStorage.getItem('userId'));
  userName = localStorage.getItem('displayName') ?? localStorage.getItem('userName') ?? '';

  activeTab: GroupTab = 'all';
  showCreateModal     = false;
  showAdminModal      = false;
  searchQuery         = '';
  loading             = false;
  toastMsg            = '';
  toastType: 'success' | 'error' = 'success';

  allGroups:      CommunityGroup[] = [];
  joinedGroups:   CommunityGroup[] = [];
  pendingGroups:  CommunityGroup[] = [];
  rejectedGroups: CommunityGroup[] = [];

  selectedAdminGroup: CommunityGroup | null = null;
  pendingRequests:    GroupMember[] = [];
  groupMembers:       GroupMember[] = [];
  adminLoading        = false;
  adminTab: AdminTab  = 'pending';
  showDeleteConfirm   = false;

  // Map of userId with fullName for members list
  memberNames = new Map<number, string>();

  createForm: FormGroup;

  constructor(
    private groupSvc: GroupService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.createForm = this.fb.group({
      name:          ['', [Validators.required, Validators.minLength(3)]],
      city:          ['', Validators.required],
      originCountry: ['', Validators.required],
      description:   ['', Validators.required],
      isPublic:      [true],
    });
  }

  ngOnInit(): void {
    this.loadAll();
    this.loadMyGroups();
  }

  loadAll(): void {
    this.loading = true;
    this.groupSvc.getAllGroups().subscribe({
      next: (groups: CommunityGroup[]) => {
        this.allGroups = groups;
        this.loading   = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  loadMyGroups(): void {
    this.groupSvc.getJoinedGroups(this.userId).subscribe((g: CommunityGroup[]) => {
      this.joinedGroups = g; this.cdr.markForCheck();
    });
    this.groupSvc.getPendingGroups(this.userId).subscribe((g: CommunityGroup[]) => {
      this.pendingGroups = g; this.cdr.markForCheck();
    });
    this.groupSvc.getRejectedGroups(this.userId).subscribe((g: CommunityGroup[]) => {
      this.rejectedGroups = g; this.cdr.markForCheck();
    });
  }

  get displayedGroups(): CommunityGroup[] {
    let list: CommunityGroup[] = [];
    switch (this.activeTab) {
      case 'all':      list = this.allGroups;      break;
      case 'joined':   list = this.joinedGroups;   break;
      case 'pending':  list = this.pendingGroups;  break;
      case 'rejected': list = this.rejectedGroups; break;
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((g: CommunityGroup) =>
        g.name.toLowerCase().includes(q) ||
        g.city?.toLowerCase().includes(q) ||
        g.originCountry?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  setTab(tab: GroupTab): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  joinGroup(groupId: number): void {
    this.groupSvc.joinGroup(groupId, this.userId).subscribe({
      next: (res) => {
        this.showToast(res.message, 'success');
        this.loadMyGroups();
        this.loadAll();
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) =>
        this.showToast(err?.error ?? 'Failed to join', 'error'),
    });
  }

  leaveGroup(groupId: number): void {
    this.groupSvc.leaveGroup(groupId, this.userId).subscribe({
      next: () => {
        this.showToast('Left the group', 'success');
        this.loadMyGroups();
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to leave group', 'error'),
    });
  }

  isJoined(groupId: number): boolean {
    return this.joinedGroups.some((g: CommunityGroup) => g.id === groupId);
  }

  isPending(groupId: number): boolean {
    return this.pendingGroups.some((g: CommunityGroup) => g.id === groupId);
  }

  isAdminOf(group: CommunityGroup): boolean {
    return group.createdBy === this.userId;
  }

  //  Admin modal 

  openAdminModal(group: CommunityGroup): void {
    this.selectedAdminGroup = group;
    this.showAdminModal     = true;
    this.adminLoading       = true;
    this.pendingRequests    = [];
    this.groupMembers       = [];
    this.memberNames        = new Map();
    this.adminTab           = 'pending';
    this.showDeleteConfirm  = false;
    this.cdr.markForCheck();

    // Load pending requests
    this.groupSvc.getPendingRequests(group.id, this.userId).subscribe({
      next: (members: GroupMember[]) => {
        this.pendingRequests = members;

    
        members.forEach((m: GroupMember) => {
          this.fetchMemberName(m.userId);
        });

        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to load requests', 'error'),
    });

    // Load all members
    this.groupSvc.getMembers(group.id, this.userId).subscribe({
      next: (members: GroupMember[]) => {
        this.groupMembers = members;
        this.adminLoading = false;

        // Fetch real name for each member from user-service
        members.forEach((m: GroupMember) => {
          this.fetchMemberName(m.userId);
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.adminLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  //  Fetch and cache member name
  private fetchMemberName(userId: number): void {
    if (this.memberNames.has(userId)) return;
    this.groupSvc.getUserById(userId).subscribe((profile: UserProfile | null) => {
      if (profile?.fullName) {
        this.memberNames.set(userId, profile.fullName);
        this.cdr.markForCheck();
      }
    });
  }

  //  Get member name from cache
  getMemberName(userId: number): string {
    return this.memberNames.get(userId) ?? `User ${userId}`;
  }

  setAdminTab(tab: AdminTab): void {
    this.adminTab = tab;
    this.cdr.markForCheck();
  }

  approveRequest(member: GroupMember): void {
    if (!this.selectedAdminGroup) return;
    this.groupSvc.approveRequest(
      this.selectedAdminGroup.id, member.userId, this.userId
    ).subscribe({
      next: () => {
        this.showToast('Request approved!', 'success');
        this.pendingRequests = this.pendingRequests.filter(
          m => m.userId !== member.userId
        );
        this.groupSvc.getMembers(this.selectedAdminGroup!.id, this.userId).subscribe(
          members => {
            this.groupMembers = members;
            members.forEach((m: GroupMember) => this.fetchMemberName(m.userId));
            this.cdr.markForCheck();
          }
        );
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to approve', 'error'),
    });
  }

  rejectRequest(member: GroupMember): void {
    if (!this.selectedAdminGroup) return;
    this.groupSvc.rejectRequest(
      this.selectedAdminGroup.id, member.userId, this.userId
    ).subscribe({
      next: () => {
        this.showToast('Request rejected', 'success');
        this.pendingRequests = this.pendingRequests.filter(
          m => m.userId !== member.userId
        );
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to reject', 'error'),
    });
  }

  removeMember(member: GroupMember): void {
    if (!this.selectedAdminGroup) return;
    this.groupSvc.removeMember(
      this.selectedAdminGroup.id, member.userId, this.userId
    ).subscribe({
      next: () => {
        this.showToast(`${this.getMemberName(member.userId)} removed`, 'success');
        this.groupMembers = this.groupMembers.filter(
          m => m.userId !== member.userId
        );
        this.loadMyGroups();
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to remove member', 'error'),
    });
  }

  confirmDeleteGroup(): void {
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  deleteGroup(): void {
    if (!this.selectedAdminGroup) return;
    this.groupSvc.deleteGroup(this.selectedAdminGroup.id, this.userId).subscribe({
      next: () => {
        this.showToast(`"${this.selectedAdminGroup!.name}" deleted`, 'success');
        const id = this.selectedAdminGroup!.id;
        this.allGroups    = this.allGroups.filter(g => g.id !== id);
        this.joinedGroups = this.joinedGroups.filter(g => g.id !== id);
        this.closeAdminModal();
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to delete group', 'error'),
    });
  }

  closeAdminModal(): void {
    this.showAdminModal     = false;
    this.selectedAdminGroup = null;
    this.pendingRequests    = [];
    this.groupMembers       = [];
    this.memberNames        = new Map();
    this.showDeleteConfirm  = false;
  }



  submitCreate(): void {  
  if (this.createForm.invalid) return;
  
  // Get admin name from localStorage and set when profile is saved
  const adminName = localStorage.getItem('displayName') ?? this.userName ?? 'Unknown';
  
  const req: CreateGroupRequest = {
    ...this.createForm.value,
    adminName: adminName, 
  };
  
  this.groupSvc.createGroup(req, this.userId).subscribe({
    next: (g: CommunityGroup) => {
      this.showToast(`"${g.name}" created!`, 'success');
      this.allGroups    = [g, ...this.allGroups];
      this.joinedGroups = [g, ...this.joinedGroups];
      this.showCreateModal = false;
      this.createForm.reset({ isPublic: true });
      this.cdr.markForCheck();
    },
    error: (err: { error?: string }) =>
      this.showToast(err?.error ?? 'Failed to create group', 'error'),
  });
}

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg  = msg;
    this.toastType = type;
    this.cdr.markForCheck();
    setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, 3500);
  }

  groupInitials(name: string): string {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(role: string): string {
    return role === 'ADMIN' ? 'Admin' : 'Member';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED': return '✓ Member';
      case 'PENDING':  return '⏳ Pending';
      case 'REJECTED': return '✗ Rejected';
      default:         return status;
    }
  }

  trackById(_: number, item: CommunityGroup): number { return item.id; }
  trackByMemberId(_: number, item: GroupMember): number { return item.id; }
}