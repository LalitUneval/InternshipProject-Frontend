import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupPanel } from '../group-panel/group-panel';
import { ChatPanel } from '../chat-panel/chat-panel';
import { ChatService } from '../../services/chat.service';

export type CommunityTab = 'groups' | 'chat';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, GroupPanel, ChatPanel],
  templateUrl: './community.html',
  styleUrls: ['./community.css'],
})
export class Community implements OnInit, OnDestroy {
  activeTab: CommunityTab = 'groups';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    const userIdStr = localStorage.getItem('userId');
    const userId    = Number(userIdStr);


    const userName  = localStorage.getItem('displayName')
                   ?? localStorage.getItem('userName')
                   ?? 'User';


    console.log('Community init — userId:', userId, 'userName:', userName);
    console.log('All localStorage:', {
      userId:       localStorage.getItem('userId'),
      displayName:  localStorage.getItem('displayName'),
      userName:     localStorage.getItem('userName'),
      userRole:     localStorage.getItem('userRole'),
    });

    if (userId && userId > 0) {
      this.chatService.connect(userId, userName);
    } else {
      console.error('No userId in localStorage — WebSocket will not connect!');
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  setTab(tab: CommunityTab): void {
    this.activeTab = tab;
  }
}