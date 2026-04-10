import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { GroupService } from '../../services/group.service';
import {
  ChatMessage, CommunityGroup, Conversation,
  ConversationPartnerDTO, TypingEvent, UserProfile,
} from '../../models/community.models';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.html',
  styleUrls: ['./chat-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  currentUserId   = Number(localStorage.getItem('userId'));
  // currentUserName = localStorage.getItem('userName') ?? 'Me';
  currentUserName = localStorage.getItem('displayName') 
               ?? localStorage.getItem('userName') 
               ?? 'User';

  chatMode: 'group' | 'private' = 'private';

  joinedGroups:  CommunityGroup[] = [];
  activeGroup:   CommunityGroup | null = null;
  groupMessages: ChatMessage[] = [];

  conversations:      Conversation[] = [];
  activeConversation: Conversation | null = null;
  privateMessages:    ChatMessage[] = [];

  userSearchQuery      = '';
  userSearchResults:   UserProfile[] = [];
  searchLoading        = false;
  conversationsLoading = false;

  typingText           = '';
  private typingTimeout: any   = null;
  private myTypingTimeout: any = null;

  private searchSubject = new Subject<string>();
  newMessage = '';
  private shouldScrollToBottom = false;
  private subs = new Subscription();

  constructor(
    private chatSvc: ChatService,
    private groupSvc: GroupService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadJoinedGroups();
    this.loadPastConversations();
    this.subscribeToPrivateMessages();
    this.subscribeToTypingEvents();
    this.setupSearch();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimeout);
    clearTimeout(this.myTypingTimeout);
  }


  //Typing Reveive
  subscribeToTypingEvents(): void {
    const sub = this.chatSvc.getTypingEvents$().subscribe((event: TypingEvent) => {
      const isRelevant =
        (this.chatMode === 'private' &&
          this.activeConversation?.user.id === event.senderId) ||
        (this.chatMode === 'group' &&
          this.activeGroup?.id === event.groupId);

      if (!isRelevant) return;

      if (event.typing) {
        this.typingText = `${event.senderName} is typing...`;
        this.shouldScrollToBottom = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.typingText = '';
          this.cdr.markForCheck();
        }, 3000);
      } else {
        clearTimeout(this.typingTimeout);
        this.typingText = '';
      }
      this.cdr.markForCheck();
    });
    this.subs.add(sub);
  }



  //Typing Send
  onTyping(): void {
    if (this.chatMode === 'private' && this.activeConversation) {
      this.chatSvc.sendPrivateTyping(
        this.activeConversation.user.id, this.currentUserName, true
      );
      clearTimeout(this.myTypingTimeout);
      this.myTypingTimeout = setTimeout(() => {
        this.chatSvc.sendPrivateTyping(
          this.activeConversation!.user.id, this.currentUserName, false
        );
      }, 2000);
    } else if (this.chatMode === 'group' && this.activeGroup) {
      this.chatSvc.sendGroupTyping(this.activeGroup.id, this.currentUserName, true);
      clearTimeout(this.myTypingTimeout);
      this.myTypingTimeout = setTimeout(() => {
        this.chatSvc.sendGroupTyping(
          this.activeGroup!.id, this.currentUserName, false
        );
      }, 2000);
    }
  }


loadPastConversations(): void {
  this.conversationsLoading = true;
  this.cdr.markForCheck();

  this.chatSvc.getConversationPartners(this.currentUserId).subscribe({
    next: (partnerIds: number[]) => {

      if (partnerIds.length === 0) {
        this.conversationsLoading = false;
        this.cdr.markForCheck();
        return;
      }

      let loaded = 0;
      const total = partnerIds.length;

      partnerIds.forEach((partnerId: number) => {

        //  Call user-service to get real name for each partner
        this.chatSvc.getUserById(partnerId).subscribe({
          next: (profile) => {
            const fullName = profile?.fullName ?? `User ${partnerId}`;

            // Get last message for preview
            this.chatSvc.getPrivateHistory(partnerId, this.currentUserId).subscribe({
              next: (msgs: ChatMessage[]) => {
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

                const lastTime = lastMsg
                  ? new Date(lastMsg.sentAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })
                  : undefined;

                const lastMessage = lastMsg
                  ? (lastMsg.senderId === this.currentUserId
                      ? `You: ${lastMsg.content}`
                      : lastMsg.content)
                  : undefined;

                const unread = msgs.filter(
                  (m: ChatMessage) =>
                    m.senderId === partnerId &&
                    m.receiverId === this.currentUserId &&
                    !m.read
                ).length;

                // Add to conversations
                const existing = this.conversations.findIndex(
                  c => c.user.id === partnerId
                );

                const conv: Conversation = {
                  user: {
                    id:            partnerId,
                    fullName,
                    originCountry: profile?.originCountry ?? '',
                    currentCity:   profile?.currentCity ?? '',
                    visaType:      profile?.visaType ?? '',
                    skills:        profile?.skills ?? '',
                    phoneNumber:   profile?.phoneNumber ?? '',
                    createdAt:     '',
                    updatedAt:     null,
                  },
                  lastMessage,
                  lastTime,
                  unread,
                };

                if (existing >= 0) {
                  this.conversations[existing] = conv;
                } else {
                  this.conversations = [...this.conversations, conv];
                }

                // Sort by most recent
                this.conversations.sort((a, b) => {
                  if (!a.lastTime && !b.lastTime) return 0;
                  if (!a.lastTime) return 1;
                  if (!b.lastTime) return -1;
                  return b.lastTime.localeCompare(a.lastTime);
                });

                loaded++;
                if (loaded === total) {
                  this.conversationsLoading = false;
                }
                this.cdr.markForCheck();
              },
              error: () => {
                loaded++;
                if (loaded === total) this.conversationsLoading = false;
                this.cdr.markForCheck();
              }
            });
          },
          error: () => {
            loaded++;
            if (loaded === total) this.conversationsLoading = false;
            this.cdr.markForCheck();
          }
        });
      });
    },
    error: () => {
      this.conversationsLoading = false;
      this.cdr.markForCheck();
    },
  });
}


  //Groups
  loadJoinedGroups(): void {
    this.groupSvc.getJoinedGroups(this.currentUserId).subscribe(
      (groups: CommunityGroup[]) => {
        this.joinedGroups = groups;
        this.cdr.markForCheck();
      }
    );
  }

  openGroupChat(group: CommunityGroup): void {
    this.chatMode      = 'group';
    this.activeGroup   = group;
    this.groupMessages = [];
    this.typingText    = '';

    this.chatSvc.getGroupHistory(group.id).subscribe((msgs: ChatMessage[]) => {
      this.chatSvc.seedGroupHistory(group.id, msgs);
      this.shouldScrollToBottom = true;
      this.cdr.markForCheck();
    });

    const sub = this.chatSvc.subscribeToGroup(group.id).subscribe(
      (msgs: ChatMessage[]) => {
        this.groupMessages        = msgs;
        this.shouldScrollToBottom = true;
        this.cdr.markForCheck();
      }
    );
    this.subs.add(sub);
  }

  sendGroupMessage(): void {
    if (!this.newMessage.trim() || !this.activeGroup) return;
    clearTimeout(this.myTypingTimeout);
    this.chatSvc.sendGroupTyping(this.activeGroup.id, this.currentUserName, false);
    this.chatSvc.sendGroupMessage({
      groupId:    this.activeGroup.id,
      content:    this.newMessage.trim(),
      senderName: this.currentUserName,
    });
    this.newMessage = '';
  }

  //Private Chat
  subscribeToPrivateMessages(): void {
    const sub = this.chatSvc.getPrivateMessages$().subscribe((msg: ChatMessage) => {
      const otherUserId = msg.senderId === this.currentUserId
        ? msg.receiverId! : msg.senderId;

      if (this.activeConversation?.user.id === otherUserId) {
        this.privateMessages      = [...this.privateMessages, msg];
        this.shouldScrollToBottom = true;
        this.typingText           = '';
        clearTimeout(this.typingTimeout);
      }

      const existingConv = this.conversations.find(c => c.user.id === otherUserId);

      // Get partner name
      const partnerName = msg.senderId === otherUserId
        ? msg.senderName
        : (msg.receiverName ?? existingConv?.user.fullName ?? `User ${otherUserId}`);

      const profile: UserProfile = existingConv?.user
        ? { ...existingConv.user, fullName: partnerName }
        : {
            id: otherUserId, fullName: partnerName,
            originCountry: '', currentCity: '',
            visaType: '', skills: '', phoneNumber: '',
            createdAt: '', updatedAt: null,
          };

      const preview = msg.senderId === this.currentUserId
        ? `You: ${msg.content}`
        : msg.content;

      this.updateConversationSidebar(msg, otherUserId, profile, preview);
      this.cdr.markForCheck();
    });
    this.subs.add(sub);
  }

  private updateConversationSidebar(
    msg: ChatMessage,
    otherUserId: number,
    userProfile: UserProfile,
    preview: string,
  ): void {
    const lastTime = new Date(msg.sentAt).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
    const idx = this.conversations.findIndex(c => c.user.id === otherUserId);
    const isActiveChat = this.activeConversation?.user?.id === otherUserId;
    const shouldIncrementUnread =
      msg.senderId !== this.currentUserId && !isActiveChat;

    if (idx >= 0) {
      const updated: Conversation = {
        ...this.conversations[idx],
        user:        userProfile,
        lastMessage: preview,
        lastTime,
        unread: shouldIncrementUnread
          ? (this.conversations[idx].unread ?? 0) + 1
          : this.conversations[idx].unread,
      };
      this.conversations = [
        updated,
        ...this.conversations.filter((_: Conversation, i: number) => i !== idx),
      ];
    } else {
      this.conversations = [{
        user: userProfile, lastMessage: preview, lastTime,
        unread: shouldIncrementUnread ? 1 : 0,
      }, ...this.conversations];
    }
    this.cdr.markForCheck();
  }

  openPrivateChat(userProfile: UserProfile): void {
    this.chatMode   = 'private';
    this.typingText = '';
    clearTimeout(this.typingTimeout);

    if (!this.conversations.find(c => c.user.id === userProfile.id)) {
      this.conversations = [{
        user: userProfile, lastMessage: undefined,
        lastTime: undefined, unread: 0,
      }, ...this.conversations];
    }

    this.activeConversation =
      this.conversations.find(c => c.user.id === userProfile.id) ??
      { user: userProfile, unread: 0 };

    const conv = this.conversations.find(c => c.user.id === userProfile.id);
    if (conv) { conv.unread = 0; this.conversations = [...this.conversations]; }

    this.privateMessages   = [];
    this.userSearchQuery   = '';
    this.userSearchResults = [];

    this.chatSvc.getPrivateHistory(userProfile.id, this.currentUserId).subscribe(
      (msgs: ChatMessage[]) => {
        this.privateMessages      = msgs;
        this.shouldScrollToBottom = true;
        this.cdr.markForCheck();
      }
    );
    this.chatSvc.markAsRead(userProfile.id, this.currentUserId).subscribe();
  }

  sendPrivateMessage(): void {
    if (!this.newMessage.trim() || !this.activeConversation) return;
    clearTimeout(this.myTypingTimeout);
    this.chatSvc.sendPrivateTyping(
      this.activeConversation.user.id, this.currentUserName, false
    );
    this.chatSvc.sendPrivateMessage({
      receiverId:   this.activeConversation.user.id,
      content:      this.newMessage.trim(),
      senderName:   this.currentUserName,
      receiverName: this.activeConversation.user.fullName, 
    });
    this.newMessage = '';
  }

  //search
  setupSearch(): void {
    const sub = this.searchSubject.pipe(
      debounceTime(350), distinctUntilChanged()
    ).subscribe((query: string) => {
      if (!query.trim()) {
        this.userSearchResults = [];
        this.searchLoading     = false;
        this.cdr.markForCheck();
        return;
      }
      this.searchLoading = true;
      this.chatSvc.searchUsers(query).subscribe({
        next: (users: UserProfile[]) => {
          this.userSearchResults = users.filter(
            (u: UserProfile) => u.id !== this.currentUserId
          );
          this.searchLoading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.searchLoading = false; this.cdr.markForCheck(); },
      });
    });
    this.subs.add(sub);
  }

  onSearchInput(): void { this.searchSubject.next(this.userSearchQuery); }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.chatMode === 'group') this.sendGroupMessage();
      else this.sendPrivateMessage();
    }
  }

  private scrollToBottom(): void {
    try { this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }); }
    catch {}
  }

  isMyMessage(msg: ChatMessage): boolean { return msg.senderId === this.currentUserId; }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
  }

  userInitials(name: string): string {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  get activeMessages(): ChatMessage[] {
    return this.chatMode === 'group' ? this.groupMessages : this.privateMessages;
  }

  get activeName(): string {
    if (this.chatMode === 'group') return this.activeGroup?.name ?? '';
    return this.activeConversation?.user.fullName ?? '';
  }

  get activeSubtitle(): string {
    if (this.chatMode === 'group')
      return this.activeGroup?.isPublic ? 'Public group' : 'Private group';
    const u = this.activeConversation?.user;
    return u ? `${u.currentCity} · ${u.originCountry}` : '';
  }

  get hasActiveChat(): boolean {
    return this.chatMode === 'group'
      ? this.activeGroup !== null
      : this.activeConversation !== null;
  }

  get totalUnread(): number {
    return this.conversations.reduce(
      (sum: number, c: Conversation) => sum + (c.unread ?? 0), 0
    );
  }
}