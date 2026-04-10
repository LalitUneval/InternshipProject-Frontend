import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { StatCard } from '../models/stat-card';
import { Job } from '../models/job';
import { activity } from '../models/activity';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private base = `${environment.jobsApi}/applications/status`;

  constructor(private http: HttpClient) {}

  // Get stat cards (job applications count etc.)
 getStats(): Observable<StatCard[]> {
  const applied$ = this.http.get<number>(`${this.base}/APPLIED`).pipe(
    catchError(() => of(0))
  );
  const interviewing$ = this.http.get<number>(`${this.base}/INTERVIEWING`).pipe(
    catchError(() => of(0))
  );
  const accepted$ = this.http.get<number>(`${this.base}/ACCEPTED`).pipe(
    catchError(() => of(0))
  );

  return forkJoin([applied$, interviewing$, accepted$]).pipe(
    map(([applied, interviewing, accepted]) => [
      {
        title: 'Jobs Applied',
        value: applied,
        description: `${applied} applications submitted`,
        color: '#3b82f6'
      },
      {
        title: 'Interviews',
        value: interviewing,
        description: `${interviewing} in interview stage`,
        color: '#10b981'
      },
      {
        title: 'Offers',
        value: accepted,
        description: `${accepted} offer(s) received`,
        color: '#f59e0b'
      }
    ])
  );
}

  // Get recommended jobs list
  getRecommendedJobs(): Observable<Job[]> {
    return of([
      { id: 1, title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA', salary: '$120k', type: 'Full-time' },
      { id: 2, title: 'Product Manager', company: 'Apple', location: 'Cupertino, CA', salary: '$130k', type: 'Full-time' },
      { id: 3, title: 'UX Designer', company: 'Netflix', location: 'Los Gatos, CA', salary: '$110k', type: 'Full-time' }
    ]);
  }

  // Get recent activity list
  getActivities(): Observable<activity[]> {
    return of([
      { title: 'Applied for Software Engineer at Google', color: '#3b82f6' },
      { title: 'Profile Updated', color: '#10b981' },
      { title: 'Viewed 5 new housing options', color: '#8b5cf6' }
    ]);
  }
}