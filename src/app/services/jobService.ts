import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from '../environment';

@Injectable({
  providedIn: "root",
})
export class JobService {
  private http = inject(HttpClient);

  private API = environment.jobsApi;

  getToken() {
    const token = localStorage.getItem("accessToken");

    const headers = new HttpHeaders({
      Authorization: token ?? "",
    });
    return headers;
  }


  getJobs(page: number, size: number) {
    const userRole = localStorage.getItem("userRole");
    const headers = this.getToken();

    let params = new HttpParams().set("page", page).set("size", size);

    if (userRole == "RECRUITER") {
      return this.http.get(`${this.API}/recruiter/jobs`, { headers, params });
    } else {
      return this.http.get(`${this.API}/all`, { params });
    }
  }

  getJobsByCompany(companyId: number) {
    const headers = this.getToken();
    return this.http.get(`${this.API}/company/${companyId}`, { headers });
  }

  searchJobs(filters: any) {
    let params = new HttpParams();

    if (filters.keyword) {
      params = params.set("keyword", filters.keyword);
    }

    if (filters.city) {
      params = params.set("city", filters.city);
    }

    if (filters.jobType) {
      params = params.set("jobType", filters.jobType);
    }

    params = params.set("page", filters.page);
    params = params.set("size", filters.size);

    const headers = this.getToken();

    return this.http.get(`${this.API}/search`, { headers, params });
  }

  createJob(companyId: number, jobData: any) {
    const headers = this.getToken();

    return this.http.post(`${this.API}/${companyId}`, jobData, { headers });
  }

  deleteJob(jobId: number) {
    const headers = this.getToken();

    return this.http.delete(`${this.API}/${jobId}`, { headers });
  }

  getJobById(jobId: number) {
    const headers = this.getToken();
    return this.http.get(`${this.API}/${jobId}`, { headers });
  }

  updateJob(jobId: number, data: any) {
    const headers = this.getToken();

    return this.http.put(`${this.API}/${jobId}`, data, { headers });
  }

  saveJob(jobId: number, userId: number) {
    const headers = this.getToken();
    return this.http.post(`${this.API}/${jobId}/save`, {}, { headers });
  }


  getSavedJobs(userId: number) {
    const headers = this.getToken();

    return this.http.get(`${this.API}/saved/user/${userId}`, { headers });
  }

  unsaveJob(jobId: number, userId: number) {
    const headers = this.getToken();

    return this.http.delete(`${this.API}/${jobId}/unsave`, { headers });
  }



  applyJob(jobId1: number) {
    const headers = this.getToken();
    return this.http.post(`${this.API}/${jobId1}/apply`, {}, { headers });
  }

  getApplyedJob(userId: number) {
    const headers = this.getToken();

    return this.http.get(`${this.API}/applications/user/${userId}`, {
      headers,
    });
  }



  getApplicationsForRecruiter() {
    const headers = this.getToken();

    return this.http.get(`${this.API}/applications/recruiter`, { headers });
  }

  updateApplicationStatus(applicationId: number, status: string) {
    const headers = this.getToken();

    return this.http.put(
      `${this.API}/applications/${applicationId}/status`,
      {},
      {
        headers,
        params: { status },
      },
    );
  }
}
