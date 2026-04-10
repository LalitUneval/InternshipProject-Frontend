import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HousingService,
  AccommodationListing,
  AccommodationRequest,
  CreateListingPayload,
  ApplyRequestPayload,
  UpdateListingPayload,
} from '../../services/housing.service';  

@Component({
  selector: 'app-housing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './housing.html',
  styleUrl: './housing.css',
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class Housing implements OnInit {

  private housingService = inject(HousingService);
  private cdr            = inject(ChangeDetectorRef);  

  //  Active tab 
  activeTab: 'browse' | 'post' | 'myListings' | 'myRequests' | 'pending' = 'browse';

  //  Browse tab 
  listings: AccommodationListing[] = [];
  loadingListings = false;
  browseLoaded    = false;

  searchQuery         = '';
  showAdvancedFilters = false;

  searchCity        = '';
  searchType        = '';
  searchMaxRent: number | null = null;
  searchMinBedrooms: number | null = null;
  searchFurnished   = ''; 
  searchUtilities   = '';

  // Detail / Apply overlay 
  selectedListing: AccommodationListing | null = null;
  showApplyForm = false;
  applyMoveIn   = '';
  applyMessage  = '';
  applyLoading  = false;

  //  Post tab 
  postForm: CreateListingPayload = this.emptyPostForm();
  postLoading = false;
  postSuccess = '';
  postError   = '';

  //  Edit overlay 
  editingListing: AccommodationListing | null = null;
  editForm: UpdateListingPayload = {};
  editLoading = false;

  //  My Listings tab 
  myListings: AccommodationListing[] = [];
  myListingsLoading = false;
  myListingsLoaded  = false;

  //  My Requests tab 
  myRequests: AccommodationRequest[] = [];
  myRequestsLoading = false;
  myRequestsLoaded  = false;
  myRequestsError   = '';

  // Pending Requests tab 
  pendingRequests: AccommodationRequest[] = [];
  pendingLoading = false;
  pendingLoaded  = false;
  pendingError   = '';

  private get userId(): number {
    return Number(localStorage.getItem('userId') || '0');
  }

  ngOnInit() {
    this.loadLatest();
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab       = tab;
    this.selectedListing = null;
    this.showApplyForm   = false;
    this.editingListing  = null;
    this.cdr.markForCheck();  

    if (tab === 'browse'     && !this.browseLoaded)    this.loadLatest();
    if (tab === 'myListings' && !this.myListingsLoaded) this.loadMyListings();
    if (tab === 'myRequests' && !this.myRequestsLoaded) this.loadMyRequests();
    if (tab === 'pending'    && !this.pendingLoaded)    this.loadPendingRequests();
  }

  // Browse

  loadLatest() {
    this.loadingListings = true;
    this.cdr.markForCheck();  
    this.housingService.getLatestListings().subscribe({
      next: (data) => {
        this.listings        = data;
        this.loadingListings = false;
        this.browseLoaded    = true;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.loadingListings = false;
        this.browseLoaded    = true;
        this.cdr.markForCheck();  
      },
    });
  }

  searchListings() {
    const query = this.searchQuery.trim();

    if (this.showAdvancedFilters) {
      this.searchWithAdvancedFilters();
      return;
    }

    if (!query) { this.loadLatest(); return; }

    this.loadingListings = true;
    this.cdr.markForCheck();  
    this.housingService.searchListings({ city: query }).subscribe({
      next: (page) => {
        this.listings        = page.content;
        this.loadingListings = false;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.loadingListings = false;
        this.cdr.markForCheck();  
      },
    });
  }

  searchWithAdvancedFilters() {
    this.loadingListings = true;
    this.cdr.markForCheck();  
    this.housingService.searchListings({
      city:                this.searchCity || undefined,
      listingType:         this.searchType || undefined,
      maxRent:             this.searchMaxRent ?? undefined,
      minBedrooms:         this.searchMinBedrooms ?? undefined,
      isFurnished:         this.searchFurnished === '' ? undefined : this.searchFurnished === 'true',
      isUtilitiesIncluded: this.searchUtilities === '' ? undefined : this.searchUtilities === 'true',
    }).subscribe({
      next: (page) => {
        this.listings        = page.content;
        this.loadingListings = false;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.loadingListings = false;
        this.cdr.markForCheck();  
      },
    });
  }

  clearSearch() {
    this.searchQuery      = '';
    this.searchCity       = '';
    this.searchType       = '';
    this.searchMaxRent    = null;
    this.searchMinBedrooms = null;
    this.searchFurnished  = '';
    this.searchUtilities  = '';
    this.loadLatest();
  }

  viewListing(listing: AccommodationListing) {
    this.selectedListing = listing;
    this.showApplyForm   = false;
    this.cdr.markForCheck();  
  }

  closeDetail() {
    this.selectedListing = null;
    this.showApplyForm   = false;
    this.cdr.markForCheck();  
  }

  openApplyForm() {
    this.showApplyForm = true;
    this.applyMoveIn   = '';
    this.applyMessage  = '';
    this.cdr.markForCheck();  
  }

  submitApplication() {
    if (!this.selectedListing) return;
    this.applyLoading = true;
    this.cdr.markForCheck();  
    const payload: ApplyRequestPayload = {
      moveInDate: this.applyMoveIn,
      message:    this.applyMessage,
    };
    this.housingService.applyForListing(this.selectedListing.id, payload).subscribe({
      next: () => {
        this.applyLoading  = false;
        this.showApplyForm = false;
        this.cdr.markForCheck();  
        alert('Application submitted successfully!');
      },
      error: () => {
        this.applyLoading = false;
        this.cdr.markForCheck();  
        alert('Failed to submit application.');
      },
    });
  }

// Post Listing

  emptyPostForm(): CreateListingPayload {
    return {
      title: '', listingType: 'APARTMENT', city: '', neighborhood: '', address: '',
      monthlyRent: 0, securityDeposit: 0, isUtilitiesIncluded: false, isFurnished: false,
      availableFrom: '', numberOfBedrooms: 1, numberOfBathrooms: 1, amenities: '', description: '',
    };
  }

  submitListing() {
    this.postLoading = true;
    this.postSuccess = '';
    this.postError   = '';
    this.cdr.markForCheck();  
    this.housingService.createListing(this.postForm).subscribe({
      next: (created) => {
        this.postLoading = false;
        this.postSuccess = 'Listing created successfully!';
        this.postForm    = this.emptyPostForm();
        if (created) {
          this.myListings      = [...this.myListings, created];
          this.myListingsLoaded = true;
        }
        this.cdr.markForCheck();  
      },
      error: () => {
        this.postLoading = false;
        this.postError   = 'Failed to create listing.';
        this.cdr.markForCheck();  
      },
    });
  }

  //  My Listings + Edit

  loadMyListings() {
    this.myListingsLoading = true;
    this.cdr.markForCheck();  
    this.housingService.getMyListings(this.userId).subscribe({
      next: (data) => {
        this.myListings        = data;
        this.myListingsLoading = false;
        this.myListingsLoaded  = true;
        this.cdr.markForCheck();  
      },
      error: () => {
        this.myListingsLoading = false;
        this.cdr.markForCheck();  
      },
    });
  }

  openEdit(listing: AccommodationListing) {
    this.editingListing = listing;
    this.editForm = {
      title:       listing.title,
      description: listing.description || '',
      monthlyRent: listing.monthlyRent,
      isActive:    listing.isActive,
    };
    this.cdr.markForCheck();  
  }

  cancelEdit() {
    this.editingListing = null;
    this.cdr.markForCheck();  
  }

  saveEdit() {
    if (!this.editingListing) return;
    this.editLoading = true;
    this.cdr.markForCheck();  
    this.housingService.updateListing(this.editingListing.id, this.editForm).subscribe({
      next: () => {
        this.editLoading      = false;
        this.editingListing   = null;
        this.myListingsLoaded = false;
        this.loadMyListings();
        this.cdr.markForCheck();  
      },
      error: () => {
        this.editLoading = false;
        this.cdr.markForCheck();  
        alert('Failed to update listing.');
      },
    });
  }

  deleteListing(id: number) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    this.housingService.deleteListing(id).subscribe({
      next: () => {
        this.myListings = this.myListings.filter(l => l.id !== id);
        this.cdr.markForCheck();  
      },
      error: () => alert('Failed to delete listing.'),
    });
  }

// My Request

  loadMyRequests() {
    this.myRequestsLoading = true;
    this.myRequestsError   = '';
    this.cdr.markForCheck();  
    this.housingService.getMyRequests(this.userId).subscribe({
      next: (data) => {
        this.myRequests        = data;
        this.myRequestsLoading = false;
        this.myRequestsLoaded  = true;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.myRequestsLoading = false;
        this.myRequestsLoaded  = true;
        if (err.status === 404) {
          this.myRequestsError = '';
          this.myRequests      = [];
        } else {
          this.myRequestsError = err.error?.message || 'Unable to load your applications. Please try again later.';
        }
        this.cdr.markForCheck();  
      },
    });
  }

  withdrawRequest(reqId: number) {
    if (!confirm('Withdraw this application?')) return;
    this.housingService.withdrawRequest(reqId).subscribe({
      next: () => this.loadMyRequests(),
      error: () => alert('Failed to withdraw request.'),
    });
  }

  //  Pending Request (owner view)
  loadPendingRequests() {
    this.pendingLoading = true;
    this.pendingError   = '';
    this.cdr.markForCheck();  
    this.housingService.getPendingOwnerRequests().subscribe({
      next: (data) => {
        this.pendingRequests = data;
        this.pendingLoading  = false;
        this.pendingLoaded   = true;
        this.cdr.markForCheck();  
      },
      error: (err) => {
        this.pendingLoading = false;
        this.pendingLoaded  = true;
        if (err.status === 404) {
          this.pendingError    = '';
          this.pendingRequests = [];
        } else {
          this.pendingError = err.error?.message || 'Unable to load incoming requests. Please try again later.';
        }
        this.cdr.markForCheck();  
      },
    });
  }

  approveRequest(reqId: number) {
    this.housingService.approveRequest(reqId).subscribe({
      next: () => {
        alert('Request approved successfully!');
        this.loadPendingRequests();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to approve request.';
        alert(msg);
        this.loadPendingRequests();
      },
    });
  }

  rejectRequest(reqId: number) {
    if (!confirm('Reject this request?')) return;
    this.housingService.rejectRequest(reqId).subscribe({
      next: () => {
        alert('Request rejected.');
        this.loadPendingRequests();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to reject request.';
        alert(msg);
        this.loadPendingRequests();
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':  return 'status-approved';
      case 'REJECTED':  return 'status-rejected';
      case 'WITHDRAWN': return 'status-withdrawn';
      default:          return 'status-pending';
    }
  }
}