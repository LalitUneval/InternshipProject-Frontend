import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CommunityGroup,
  CreateGroupRequest,
  GroupMember,
  JoinGroupResponse,
  UserProfile,
} from '../models/community.models';
import { environment } from '../environment';

const BASE = environment.communityGroupsApi;
const USER_API = environment.usersApi;

@Injectable({ providedIn: 'root' })
export class GroupService {
  constructor(private http: HttpClient) {}

  private headers(userId: number, role?: string): HttpHeaders {
    let h = new HttpHeaders({ 'X-User-Id': String(userId) });
    if (role) {
      h = h.set('X-User-Role', role);
    }
    return h;
  }

  getAllGroups(): Observable<CommunityGroup[]> {
    return this.http.get<CommunityGroup[]>(BASE);
  }

  createGroup(req: CreateGroupRequest, userId: number): Observable<CommunityGroup> {
    return this.http.post<CommunityGroup>(BASE, req, {
      headers: this.headers(userId, 'ADMIN'),
    });
  }

  searchByName(name: string): Observable<CommunityGroup[]> {
    return this.http.get<CommunityGroup[]>(`${BASE}/search-name`, {
      params: { name },
    });
  }

  getJoinedGroups(userId: number): Observable<CommunityGroup[]> {
    return this.http.get<CommunityGroup[]>(`${BASE}/my-groups/joined`, {
      headers: this.headers(userId),
    });
  }

  getPendingGroups(userId: number): Observable<CommunityGroup[]> {
    return this.http.get<CommunityGroup[]>(`${BASE}/my-groups/pending`, {
      headers: this.headers(userId),
    });
  }

  getRejectedGroups(userId: number): Observable<CommunityGroup[]> {
    return this.http.get<CommunityGroup[]>(`${BASE}/my-groups/rejected`, {
      headers: this.headers(userId),
    });
  }

  joinGroup(groupId: number, userId: number): Observable<JoinGroupResponse> {
    return this.http.post<JoinGroupResponse>(
      `${BASE}/${groupId}/join`,
      {},
      { headers: this.headers(userId) }
    );
  }

  leaveGroup(groupId: number, userId: number): Observable<void> {
    return this.http.post<void>(
      `${BASE}/${groupId}/leave`,
      {},
      { headers: this.headers(userId) }
    );
  }

  getMembers(groupId: number, userId: number): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${BASE}/${groupId}/members`, {
      headers: this.headers(userId),
    });
  }

  getPendingRequests(groupId: number, adminId: number): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${BASE}/${groupId}/pending-requests`, {
      headers: this.headers(adminId),
    });
  }

  approveRequest(groupId: number, userId: number, adminId: number): Observable<GroupMember> {
    return this.http.post<GroupMember>(
      `${BASE}/${groupId}/approve/${userId}`,
      {},
      { headers: this.headers(adminId) }
    );
  }

  rejectRequest(groupId: number, userId: number, adminId: number): Observable<GroupMember> {
    return this.http.post<GroupMember>(
      `${BASE}/${groupId}/reject/${userId}`,
      {},
      { headers: this.headers(adminId) }
    );
  }

  removeMember(groupId: number, userId: number, adminId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${groupId}/members/${userId}`, {
      headers: this.headers(adminId),
    });
  }

  deleteGroup(groupId: number, adminId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${groupId}`, {
      headers: this.headers(adminId, 'ADMIN'),
    });
  }

  getUserById(userId: number): Observable<UserProfile | null> {
    return this.http
      .get<UserProfile>(`${USER_API}/profile/${userId}`)
      .pipe(catchError(() => of(null)));
  }
}