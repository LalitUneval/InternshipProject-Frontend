

export interface CurrentUser {
  userId: number;
  userName: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  originCountry: string;
  currentCity: string;
  visaType: string;
  skills: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CommunityGroup {
  id: number;
  name: string;
  city: string;
  originCountry: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  adminName: string;
  createdBy: number;    
}

export interface CreateGroupRequest {
  name: string;
  city: string;
  originCountry: string;
  description: string;
  isPublic: boolean;
  adminName:     string;
}

export interface JoinGroupResponse {
  groupId: number;
  userId: number;
  status: string;
  message: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  status: string;
  role: string;
  joinedAt: string;
  requestedAt: string;
}

export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE';
export type ChatType    = 'GROUP' | 'PRIVATE';

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  receiverName?: string;
  groupId?: number;
  receiverId?: number;
  content: string;
  messageType: MessageType;
  chatType: ChatType;
  sentAt: string;
  read: boolean;
}

export interface GroupMessageRequest {
  groupId: number;
  content: string;
  senderName: string;
}

export interface PrivateMessageRequest {
  receiverId:   number;
  content:      string;
  senderName:   string;
  receiverName: string;
}

export interface Conversation {
  user: UserProfile;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
}

export interface TypingEvent {
  senderId: number;
  senderName: string;
  receiverId?: number;
  groupId?: number;
  chatType: 'PRIVATE' | 'GROUP';
  typing: boolean;
}

export interface ConversationPartnerDTO {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}