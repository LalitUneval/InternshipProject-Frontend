import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from '../environment';

@Injectable({
  providedIn: "root",
})
export class Company {
  private http = inject(HttpClient);

  private API = `${environment.jobsApi}/companies`;

  getToken() {
    const token = localStorage.getItem("accessToken");

    const headers = new HttpHeaders({
      Authorization: token ?? "", // or USER depending on your system
    });
    return headers;
  }

  getCompany() {
    const userRole = localStorage.getItem("userRole");

    const headers = this.getToken();

    if (userRole == "RECRUITER") {
      return this.http.get(`${this.API}/recruiter`, { headers });
    }
    return this.http.get(`${this.API}/all`, { headers });
  }

  searchCompany(name: string) {
    const headers = this.getToken();
    const params = new HttpParams().set("name", name);
    return this.http.get(`${this.API}/search`, { headers, params });
  }

  addCompany(data: any) {
    const headers = this.getToken();

    return this.http.post(`${this.API}/add`, data, { headers });
  }

  deleteCompany(companyId: number) {
    const headers = this.getToken();

    return this.http.delete(`${this.API}/${companyId}`, { headers });
  }

  getCompanyById(id: number) {
    const headers = this.getToken();
    return this.http.get(`${this.API}/${id}`, { headers });
  }

  updateCompany(id: number, data: any) {
    const headers = this.getToken();

    return this.http.put(`${this.API}/${id}`, data, { headers });
  }
}
