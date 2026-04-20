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
  id: number;
}

@Component({
  selector: "app-ai-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./ai-chat.html",
  styleUrls: ["./ai-chat.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChat implements OnInit, AfterViewChecked, OnDestroy {
  isOpen = false;
  userInput = "";
  messages: ChatMessage[] = [];
  isLoading = false;

  // --- Draggable button position ---
  btnBottom = 20;
  btnRight = 20;

  // Chat box floats 64px above the button
  get chatBottom() { return this.btnBottom + 64; }
  get chatRight()  { return this.btnRight; }

  private messageId = 0;
  private readonly MAX_MESSAGES = 50;
  private shouldScroll = false;

  // Drag state
  private isDragging = false;
  private hasDragged = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private boundMouseMove: any;
  private boundMouseUp: any;

  @Input() skills: string = "";

  @ViewChild("chatContainer") chatContainer!: ElementRef;

  private API_URL = `${environment.aiApi}/chat`;
  private mutationObserver: MutationObserver | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Restore saved button position
    const saved = localStorage.getItem('chatBtnPos');
    if (saved) {
      try {
        const { bottom, right } = JSON.parse(saved);
        this.btnBottom = bottom;
        this.btnRight = right;
      } catch {}
    }

    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Listen for dark mode toggle from dashboard
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
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
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    // Clean up any lingering drag listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }
  }

  // ─── Drag Logic ────────────────────────────────────────────

  onDragStart(e: MouseEvent) {
    this.isDragging = true;
    this.hasDragged = false;

    // Calculate offset from button's current position to mouse
    this.dragOffsetX = window.innerWidth - e.clientX - this.btnRight;
    this.dragOffsetY = window.innerHeight - e.clientY - this.btnBottom;

    this.boundMouseMove = this.onDragMove.bind(this);
    this.boundMouseUp   = this.onDragEnd.bind(this);

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup',   this.boundMouseUp);

    e.preventDefault(); // prevent text selection while dragging
  }

  private onDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.hasDragged = true;

    const btnSize = 52; // button diameter in px

    this.btnRight = Math.max(8, Math.min(
      window.innerWidth - btnSize,
      window.innerWidth - e.clientX - this.dragOffsetX
    ));

    this.btnBottom = Math.max(8, Math.min(
      window.innerHeight - btnSize,
      window.innerHeight - e.clientY - this.dragOffsetY
    ));

    this.cdr.markForCheck();
  }

  private onDragEnd() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup',   this.boundMouseUp);

    // Persist position across page reloads
    localStorage.setItem('chatBtnPos', JSON.stringify({
      bottom: this.btnBottom,
      right:  this.btnRight
    }));
  }

  // Called on (click) — only toggles if user didn't drag
  onToggleClick(e: MouseEvent) {
    if (this.hasDragged) return;
    this.toggleChat();
  }

  // ─── Chat Logic ────────────────────────────────────────────

  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck();
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
    this.shouldScroll = true;
    this.cdr.markForCheck();
  }

  private addBotMessage(text: string) {
    this.messages.push({ text, sender: "bot", id: ++this.messageId });
    this.limitMessageHistory();
    this.shouldScroll = true;
    this.cdr.markForCheck();
  }

  private limitMessageHistory() {
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages = this.messages.slice(-this.MAX_MESSAGES);
    }
  }

  private callAI(message: string) {
    this.isLoading = true;
    this.cdr.markForCheck();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    this.http
      .post<string>(
        this.API_URL,
        { message, skills: this.skills },
        { headers, responseType: "text" as "json" },
      )
      .subscribe({
        next: (res) => {
          const replyText = res?.trim();
          if (replyText) {
            this.addBotMessage(this.formatResponse(replyText));
          } else {
            this.addBotMessage("⚠️ Received response but no message text was found");
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          const errText = error?.error?.message || error?.message || "Server not reachable";
          this.addBotMessage(`⚠️ ${errText}`);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private formatResponse(text: string): string {
    if (!text) return "";
    return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.chatContainer?.nativeElement) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}