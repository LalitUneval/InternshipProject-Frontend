import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  AfterViewChecked,
  OnDestroy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { environment } from '../../environment';

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  id: number; // Add ID for trackBy optimization
}

@Component({
  selector: "app-ai-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./ai-chat.html",
  styleUrls: ["./ai-chat.css"],
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Optimize change detection
})
export class AiChat implements OnInit, AfterViewChecked, OnDestroy {
  isOpen = false;
  userInput = "";
  messages: ChatMessage[] = [];
  isLoading = false;
  private messageId = 0; // For unique IDs
  private readonly MAX_MESSAGES = 50; // Limit message history
  private shouldScroll = false; // Flag to trigger scroll after view check

  @Input() skills: string = "";

  @ViewChild("chatContainer") chatContainer!: ElementRef;

  private API_URL = `${environment.aiApi}/chat`;
  private mutationObserver: MutationObserver | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }
    
    // Listen for class changes on document.body (dark mode toggle from dashboard)
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // Class changed, trigger change detection
          this.cdr.markForCheck();
        }
      });
    });
    
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngAfterViewChecked() {
    // Auto-scroll after view is updated
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    // Cleanup observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  // ⚡ TrackBy function for ngFor optimization
  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck(); // Manual change detection
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (!message) return;

    this.addUserMessage(message);
    this.userInput = "";

    if (message.toLowerCase() === "hi" || message.toLowerCase() === "hey") {
      this.addBotMessage("Hey 👋 How can I help you today?");
      return;
    }

    this.callAI(message);
  }

  private addUserMessage(text: string) {
    this.messages.push({ text, sender: "user", id: ++this.messageId });
    this.limitMessageHistory();
    this.shouldScroll = true; // Flag for auto-scroll after view update
    this.cdr.markForCheck(); // Manual change detection
  }

  private addBotMessage(text: string) {
    this.messages.push({ text, sender: "bot", id: ++this.messageId });
    this.limitMessageHistory();
    this.shouldScroll = true; // Flag for auto-scroll after view update
    this.cdr.markForCheck(); // Manual change detection
  }

  // ⚡ Limit message history to prevent memory bloat
  private limitMessageHistory() {
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages = this.messages.slice(-this.MAX_MESSAGES);
    }
  }

  private callAI(message: string) {
    this.isLoading = true;
    this.cdr.markForCheck(); // Update loading state immediately

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    this.http
      .post<string>(
        this.API_URL,
        {
          message,
          skills: this.skills,
        },
        {
          headers,
          responseType: "text" as "json",
        },
      )
      .subscribe({
        next: (res) => {
          const replyText = res?.trim();
          if (replyText) {
            this.addBotMessage(this.formatResponse(replyText));
          } else {
            this.addBotMessage(
              "⚠️ Received response but no message text was found",
            );
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          const errText =
            error?.error?.message || error?.message || "Server not reachable";
          this.addBotMessage(`⚠️ ${errText}`);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ⚡ Ultra-fast formatting - minimal operations
  private formatResponse(text: string): string {
    if (!text) return "";
    // Single pass replacement for better performance
    return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }

  private scrollToBottom() {
    // ⚡ Use requestAnimationFrame for smooth scroll after DOM update
    requestAnimationFrame(() => {
      if (this.chatContainer?.nativeElement) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
