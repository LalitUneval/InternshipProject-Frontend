import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UserProfile } from "../models/user-profile";
import { environment } from '../environment';


export interface UserProfileResponse {
  id: number;
  fullName: string;
  originCountry: string;
  currentCity: string;
  visaType: string;
  skills: string;
  phoneNumber: string;
}

@Injectable({
  providedIn: "root",
})
export class ProfileService {

  private http    = inject(HttpClient);
  private BASE    = `${environment.usersApi}/profile`;


  getMyProfile(): Observable<UserProfileResponse> {
    const userId = localStorage.getItem("userId") || "0";
    return this.http.get<UserProfileResponse>(`${this.BASE}/${userId}`);
  }

  saveProfile(profile: UserProfile): Observable<any> {
    return this.http.post(this.BASE, profile);
  }


  updateProfile(userId: number, profile: Partial<UserProfile>): Observable<any> {
    return this.http.put(`${this.BASE}/${userId}`, profile);
  }
}
