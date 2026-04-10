import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../environment';


export interface UserProfileDTO {
  id: number;
  fullName: string;
  phoneNumber: string;
}

export interface AccommodationListing {
  id: number;
  title: string;
  listingType: string;
  city: string;
  neighborhood?: string;
  address?: string;
  monthlyRent: number;
  securityDeposit?: number;
  isUtilitiesIncluded: boolean;
  isFurnished: boolean;
  availableFrom?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  amenities?: string;
  description?: string;
  postedBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  userProfileDTO: UserProfileDTO;
}

export interface AccommodationRequest {
  id: number;
  userId: number;
  listingId: number;
  listingTitle: string;
  listingCity: string;
  monthlyRent: number;
  status: string;          
  moveInDate: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}



export interface CreateListingPayload {
  title: string;
  listingType: string;
  city: string;
  neighborhood?: string;
  address?: string;
  monthlyRent: number;
  securityDeposit?: number;
  isUtilitiesIncluded: boolean;
  isFurnished: boolean;
  availableFrom?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  amenities?: string;
  description?: string;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  monthlyRent?: number;
  isActive?: boolean;
}

export interface ApplyRequestPayload {
  moveInDate: string;
  message: string;
}

export interface SearchParams {
  city?: string;
  listingType?: string;
  maxRent?: number;
  minBedrooms?: number;
  isFurnished?: boolean;
  isUtilitiesIncluded?: boolean;
  page?: number;
  size?: number;
}



@Injectable({ providedIn: "root" })
export class HousingService {
  private http = inject(HttpClient);
  private BASE = environment.relocationApi;

  //  Accommodation Listings 

  createListing(data: CreateListingPayload): Observable<AccommodationListing> {
    return this.http.post<AccommodationListing>(
      `${this.BASE}/accommodations`,
      data,
    );
  }

  getListingById(id: number): Observable<AccommodationListing> {
    return this.http.get<AccommodationListing>(
      `${this.BASE}/accommodations/${id}`,
    );
  }

  searchListings(
    params: SearchParams,
  ): Observable<PagedResponse<AccommodationListing>> {
    let httpParams = new HttpParams();
    if (params.city) httpParams = httpParams.set("city", params.city);
    if (params.listingType)
      httpParams = httpParams.set("listingType", params.listingType);
    if (params.maxRent != null)
      httpParams = httpParams.set("maxRent", params.maxRent);
    if (params.minBedrooms != null)
      httpParams = httpParams.set("minBedrooms", params.minBedrooms);
    if (params.isFurnished != null)
      httpParams = httpParams.set("isFurnished", params.isFurnished);
    if (params.isUtilitiesIncluded != null)
      httpParams = httpParams.set(
        "isUtilitiesIncluded",
        params.isUtilitiesIncluded,
      );
    httpParams = httpParams.set("page", params.page ?? 0);
    httpParams = httpParams.set("size", params.size ?? 10);

    return this.http.get<PagedResponse<AccommodationListing>>(
      `${this.BASE}/accommodations/search`,
      { params: httpParams },
    );
  }

  getListingsByCity(city: string): Observable<AccommodationListing[]> {
    return this.http.get<AccommodationListing[]>(
      `${this.BASE}/accommodations/city/${city}`,
    );
  }

  getMyListings(userId: number): Observable<AccommodationListing[]> {
    return this.http.get<AccommodationListing[]>(
      `${this.BASE}/accommodations/user/${userId}`,
    );
  }

  getLatestListings(): Observable<AccommodationListing[]> {
    return this.http.get<AccommodationListing[]>(
      `${this.BASE}/accommodations/latest`,
    );
  }

  updateListing(
    id: number,
    data: UpdateListingPayload,
  ): Observable<AccommodationListing> {
    return this.http.put<AccommodationListing>(
      `${this.BASE}/accommodations/${id}`,
      data,
    );
  }

  deactivateListing(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.BASE}/accommodations/${id}/deactivate`,
      {},
    );
  }

  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/accommodations/${id}`);
  }


  applyForListing(
    listingId: number,
    data: ApplyRequestPayload,
  ): Observable<AccommodationRequest> {
    return this.http.post<AccommodationRequest>(
      `${this.BASE}/accommodations/${listingId}/request`,
      data,
    );
  }

  getRequestById(id: number): Observable<AccommodationRequest> {
    return this.http.get<AccommodationRequest>(`${this.BASE}/requests/${id}`);
  }

  getMyRequests(userId: number): Observable<AccommodationRequest[]> {
    return this.http.get<AccommodationRequest[]>(
      `${this.BASE}/requests/user/${userId}`,
    );
  }

  getOwnerRequests(): Observable<AccommodationRequest[]> {
    return this.http.get<AccommodationRequest[]>(`${this.BASE}/requests/owner`);
  }

  getPendingOwnerRequests(): Observable<AccommodationRequest[]> {
    return this.http.get<AccommodationRequest[]>(
      `${this.BASE}/requests/owner/pending`,
    );
  }

  approveRequest(requestId: number): Observable<AccommodationRequest> {
    return this.http.put<AccommodationRequest>(
      `${this.BASE}/requests/${requestId}/approve`,
      {},
    );
  }

  rejectRequest(requestId: number): Observable<AccommodationRequest> {
    return this.http.put<AccommodationRequest>(
      `${this.BASE}/requests/${requestId}/reject`,
      {},
    );
  }

  withdrawRequest(requestId: number): Observable<void> {
    return this.http.put<void>(
      `${this.BASE}/requests/${requestId}/withdraw`,
      {},
    );
  }

  deleteRequest(requestId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/requests/${requestId}`);
  }
}
