
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import {
  ChatMessage,
  ConversationPartnerDTO,
  GroupMessageRequest,
  PrivateMessageRequest,
  TypingEvent,
  UserProfile,
} from '../models/community.models';
import { environment } from '../environment';

import SockJS from 'sockjs-client';

const WS_URL    = environment.communityWsUrl;
const REST_BASE = environment.communityChatApi;
const USER_API  = environment.usersApi;

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {

  private stompClient!: Client;
  private connected = false;

  private groupMessages    = new Map<number, BehaviorSubject<ChatMessage[]>>();
  private privateMessages$ = new Subject<ChatMessage>();
  private typingEvents$    = new Subject<TypingEvent>();
  private unreadCount$     = new BehaviorSubject<number>(0);

  private profileCache = new Map<number, UserProfile>();

  constructor(private http: HttpClient) {}

  

  connect(userId: number, userName: string): void {
    if (this.connected) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { userId: String(userId), userName },
      reconnectDelay: 5000,
      debug: (msg: string) => console.debug('[STOMP]', msg),

      onConnect: () => {
        this.connected = true;
        console.log(' WebSocket connected');

        this.stompClient.subscribe('/user/queue/private', (frame: IMessage) => {
          const msg: ChatMessage = JSON.parse(frame.body);
          this.privateMessages$.next(msg);
          this.unreadCount$.next(this.unreadCount$.value + 1);
        });

        this.stompClient.subscribe('/user/queue/typing', (frame: IMessage) => {
          const event: TypingEvent = JSON.parse(frame.body);
          this.typingEvents$.next(event);
        });
      },

      onDisconnect: () => { this.connected = false; },
      onStompError: (frame) => console.error('STOMP error:', frame.headers['message']),
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) this.stompClient.deactivate();
  }

  

  subscribeToGroup(groupId: number): Observable<ChatMessage[]> {
    if (!this.groupMessages.has(groupId)) {
      this.groupMessages.set(groupId, new BehaviorSubject<ChatMessage[]>([]));
      this.stompClient.subscribe(`/topic/group.${groupId}`, (frame: IMessage) => {
        const msg: ChatMessage = JSON.parse(frame.body);
        const subject = this.groupMessages.get(groupId)!;
        subject.next([...subject.value, msg]);
      });
    }
    return this.groupMessages.get(groupId)!.asObservable();
  }

  subscribeToGroupTyping(groupId: number): Subject<TypingEvent> {
    const subject = new Subject<TypingEvent>();
    this.stompClient.subscribe(
      `/topic/group.${groupId}.typing`,
      (frame: IMessage) => { subject.next(JSON.parse(frame.body)); }
    );
    return subject;
  }

  seedGroupHistory(groupId: number, history: ChatMessage[]): void {
    if (!this.groupMessages.has(groupId)) {
      this.groupMessages.set(groupId, new BehaviorSubject<ChatMessage[]>(history));
    } else {
      this.groupMessages.get(groupId)!.next(history);
    }
  }

  sendGroupMessage(req: GroupMessageRequest): void {
    if (!this.connected) return;
    this.stompClient.publish({ destination: '/app/chat.group', body: JSON.stringify(req) });
  }



  getPrivateMessages$(): Observable<ChatMessage> { return this.privateMessages$.asObservable(); }
  getTypingEvents$():    Observable<TypingEvent>  { return this.typingEvents$.asObservable(); }

  sendPrivateMessage(req: PrivateMessageRequest): void {
    if (!this.connected) return;
    this.stompClient.publish({ destination: '/app/chat.private', body: JSON.stringify(req) });
  }

  sendPrivateTyping(receiverId: number, senderName: string, typing: boolean): void {
    if (!this.connected) return;
    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ receiverId, senderName, chatType: 'PRIVATE', typing }),
    });
  }

  sendGroupTyping(groupId: number, senderName: string, typing: boolean): void {
    if (!this.connected) return;
    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ groupId, senderName, chatType: 'GROUP', typing }),
    });
  }

  getUnreadCount$(): Observable<number> { return this.unreadCount$.asObservable(); }
  resetUnread(): void { this.unreadCount$.next(0); }



  getGroupHistory(groupId: number, limit = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${REST_BASE}/group/${groupId}/history?limit=${limit}`
    );
  }

  getPrivateHistory(otherUserId: number, userId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${REST_BASE}/private/${otherUserId}`, {
      headers: new HttpHeaders({ 'X-User-Id': String(userId) })
    }).pipe(catchError(() => of([])));
  }

  markAsRead(senderId: number, userId: number): Observable<void> {
    return this.http.put<void>(`${REST_BASE}/private/${senderId}/read`, {}, {
      headers: new HttpHeaders({ 'X-User-Id': String(userId) })
    }).pipe(catchError(() => of(undefined as any)));
  }


  getConversationPartners(userId: number): Observable<number[]> {
  return this.http.get<number[]>(`${REST_BASE}/conversations`, {
    headers: new HttpHeaders({ 'X-User-Id': String(userId) })
  }).pipe(catchError(() => of([])));
}



  getUserById(userId: number): Observable<UserProfile | null> {
    if (this.profileCache.has(userId)) return of(this.profileCache.get(userId)!);
    return this.http.get<UserProfile>(`${USER_API}/profile/${userId}`).pipe(
      map((p: UserProfile) => { this.profileCache.set(userId, p); return p; }),
      catchError(() => of(null))
    );
  }

  searchUsers(name: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${USER_API}/search`, {
      params: { name }
    }).pipe(catchError(() => of([])));
  }

  ngOnDestroy(): void { this.disconnect(); }
}