
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export type ServiceType =
  | "VISA_ASSISTANCE"
  | "AIRPORT_PICKUP"
  | "FURNITURE_RENTAL"
  | "MOVING_SERVICE"
  | "LEGAL_CONSULTATION"
  | "DOCUMENT_TRANSLATION";

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ServiceProvider {
  id: number;
  name: string;
  serviceType: ServiceType;
  city: string;
  contactNumber?: string;
  email?: string;
  description?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  ownerUserId?: number;
}

export interface ServiceBooking {
  id: number;
  userId: number;
  serviceProviderId: number;
  serviceProviderName: string;
  serviceType: ServiceType;
  status: BookingStatus;
  bookingDate: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ProviderApplication {
  id: number;
  applicantUserId: number;
  name: string;
  serviceType: ServiceType;
  city: string;
  contactNumber?: string;
  email?: string;
  description?: string;
  status: ApplicationStatus;
  adminNote?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface CreateApplicationPayload {
  applicantUserId: number;
  name: string;
  serviceType: ServiceType;
  city: string;
  contactNumber?: string;
  email?: string;
  description?: string;
}

export interface ReviewApplicationPayload {
  adminNote?: string;
}

export interface CreateProviderPayload {
  name: string;
  serviceType: ServiceType;
  city: string;
  contactNumber?: string;
  email?: string;
  description?: string;
  isVerified?: boolean;
}

export interface UpdateProviderPayload {
  contactNumber?: string;
  email?: string;
  description?: string;
  isVerified?: boolean;
}

export interface CreateBookingPayload {
  bookingDate: string;
  notes?: string;
}

export interface SearchParams {
  city?: string;
  serviceType?: ServiceType | "";
  isVerified?: boolean;
  minRating?: number;
}

const BASE = environment.relocationApi;

@Injectable({ providedIn: "root" })
export class RelocationService {
  private http = inject(HttpClient);

  private userHeaders(userId: number): HttpHeaders {
    return new HttpHeaders({ "X-User-Id": String(userId) });
  }
  private adminHeaders(): HttpHeaders {
    return new HttpHeaders({ "X-User-Role": "ADMIN" });
  }


  getAllProviders(): Observable<ServiceProvider[]> {
    return this.http.get<ServiceProvider[]>(`${BASE}/services`);
  }
  searchProviders(params: SearchParams): Observable<ServiceProvider[]> {
    let p = new HttpParams();
    if (params.city) p = p.set("city", params.city);
    if (params.serviceType) p = p.set("serviceType", params.serviceType);
    if (params.isVerified != null)
      p = p.set("isVerified", String(params.isVerified));
    if (params.minRating != null)
      p = p.set("minRating", String(params.minRating));
    return this.http.get<ServiceProvider[]>(`${BASE}/services/search`, {
      params: p,
    });
  }
  createProvider(data: CreateProviderPayload): Observable<ServiceProvider> {
    return this.http.post<ServiceProvider>(`${BASE}/services`, data, {
      headers: this.adminHeaders(),
    });
  }
  updateProvider(
    id: number,
    data: UpdateProviderPayload,
  ): Observable<ServiceProvider> {
    return this.http.put<ServiceProvider>(`${BASE}/services/${id}`, data, {
      headers: this.adminHeaders(),
    });
  }
  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/services/${id}`, {
      headers: this.adminHeaders(),
    });
  }


  submitApplication(data: CreateApplicationPayload): Observable<ProviderApplication> {
    return this.http.post<ProviderApplication>(`${BASE}/applications`, data);
  }
  getMyApplications(userId: number): Observable<ProviderApplication[]> {
    return this.http.get<ProviderApplication[]>(
      `${BASE}/applications/my/${userId}`,
    );
  }
  getAllApplications(): Observable<ProviderApplication[]> {
    return this.http.get<ProviderApplication[]>(`${BASE}/applications`, {
      headers: this.adminHeaders(),
    });
  }
  approveApplication(
    id: number,
    note?: string,
  ): Observable<ProviderApplication> {
    return this.http.put<ProviderApplication>(
      `${BASE}/applications/${id}/approve`,
      note ? { adminNote: note } : {},
      { headers: this.adminHeaders() },
    );
  }
  rejectApplication(
    id: number,
    note?: string,
  ): Observable<ProviderApplication> {
    return this.http.put<ProviderApplication>(
      `${BASE}/applications/${id}/reject`,
      note ? { adminNote: note } : {},
      { headers: this.adminHeaders() },
    );
  }


  bookService(serviceId: number, userId: number, data: CreateBookingPayload): Observable<ServiceBooking> {
    const payload = { ...data, userId, serviceProviderId: serviceId };
    return this.http.post<ServiceBooking>(`${BASE}/bookings`, payload);
  }
  getUserBookings(userId: number): Observable<ServiceBooking[]> {
    return this.http.get<ServiceBooking[]>(`${BASE}/bookings/user/${userId}`, {
      headers: this.userHeaders(userId),
    });
  }
  getUpcomingBookings(userId: number): Observable<ServiceBooking[]> {
    return this.http.get<ServiceBooking[]>(`${BASE}/bookings/upcoming`, {
      headers: this.userHeaders(userId),
    });
  }
  cancelBooking(bookingId: number, userId: number): Observable<void> {
    return this.http.put<void>(
      `${BASE}/bookings/${bookingId}/cancel`,
      {},
      { headers: this.userHeaders(userId) },
    );
  }
  completeBooking(
    bookingId: number,
    rating?: number,
  ): Observable<ServiceBooking> {
    let params = new HttpParams();
    if (rating != null) params = params.set("rating", String(rating));
    return this.http.put<ServiceBooking>(
      `${BASE}/bookings/${bookingId}/complete`,
      {},
      { params },
    );
  }
  deleteBooking(bookingId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/bookings/${bookingId}`, {
      headers: this.userHeaders(userId),
    });
  }

  getMyProviderId(userId: number): Observable<number> {
    return this.http.get<number>(`${BASE}/bookings/my-provider`, {
      headers: this.userHeaders(userId),
    });
  }


  getProviderBookings(providerId: number): Observable<ServiceBooking[]> {
    return this.http.get<ServiceBooking[]>(
      `${BASE}/bookings/provider/${providerId}`,
    );
  }


  providerConfirmBooking(bookingId: number, providerUserId: number): Observable<ServiceBooking> {
    return this.http.put<ServiceBooking>(`${BASE}/bookings/${bookingId}/provider-confirm`, {},
      { headers: this.userHeaders(providerUserId) });
  }

  adminConfirmBooking(bookingId: number): Observable<ServiceBooking> {
    return this.http.put<ServiceBooking>(
      `${BASE}/bookings/${bookingId}/confirm`,
      {},
      { headers: this.adminHeaders() },
    );
  }
}
