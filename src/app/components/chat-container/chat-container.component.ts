import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { PromptApiService } from '../../services/prompt-api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { StorageService } from '../../services/storage.service';
import { SummarizerService } from '../../services/summarizer.service';
import { ChatMessage, ChatErrorType, ChatSession } from '../../models/chat.models';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MessageListComponent,
    MessageInputComponent,
  ],
  templateUrl: './chat-container.component.html',
  styleUrl: './chat-container.component.css',
})
export class ChatContainerComponent implements OnInit {
  private promptApiService = inject(PromptApiService);
  private snackbarService = inject(SnackbarService);
  private storageService = inject(StorageService);
  private summarizerService = inject(SummarizerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  messages = signal<ChatMessage[]>([]);
  isLoading = signal<boolean>(false);
  tokenUsage = signal<number>(0);
  tokenQuota = signal<number>(0);

  chatId: string | null = null;
  chatTitle = 'New Chat';

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        if (this.chatId !== id) {
          this.chatId = id;
          await this.loadChat(id);
        }
      } else {
        this.newChat();
      }
    });
  }

  async loadChat(id: string): Promise<void> {
    const chat = await this.storageService.getChat(id);
    if (chat) {
      this.messages.set(chat.messages);
      this.tokenUsage.set(chat.tokenUsage);
      this.chatTitle = chat.title;
    } else {
      this.snackbarService.error('Chat not found');
      this.router.navigate(['/']);
    }
  }

  async onSendMessage(content: string): Promise<void> {
    if (!content.trim() || this.isLoading()) {
      return;
    }

    const currentMessages = this.messages();
    const isFirstMessage = currentMessages.length === 0;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    this.messages.update((msgs) => [...msgs, userMessage]);
    this.isLoading.set(true);

    // Create assistant message placeholder
    const assistantMessageId = this.generateId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    this.messages.update((msgs) => [...msgs, assistantMessage]);

    try {
      // Get streaming response
      const stream = await this.promptApiService.promptStreaming(content);
      let fullResponse = '';

      // Process stream
      for await (const chunk of stream) {
        fullResponse += chunk;

        // Update the assistant message with accumulated content
        this.messages.update((msgs) =>
          msgs.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg
          )
        );
      }

      // Mark streaming as complete
      this.messages.update((msgs) =>
        msgs.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg))
      );

      // Update token usage
      this.updateTokenUsage();

      // Save chat
      await this.saveCurrentChat(isFirstMessage, content);
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Remove the streaming assistant message
      this.messages.update((msgs) => msgs.filter((msg) => msg.id !== assistantMessageId));

      // Handle different error types
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveCurrentChat(isFirstMessage: boolean, firstPrompt: string): Promise<void> {
    // If it's a new chat, generate ID and title
    if (!this.chatId) {
      this.chatId = this.generateId();

      // Generate title asynchronously
      const summary = await this.summarizerService.summarize(firstPrompt);
      this.chatTitle = summary;

      // Update URL without reloading (optional, but good UX)
      // Actually, navigation is better to ensure consistent state/URL
      this.router.navigate(['/chat', this.chatId], { replaceUrl: true });
    }

    const chatSession: ChatSession = {
      id: this.chatId!,
      title: this.chatTitle,
      timestamp: new Date(),
      messages: this.messages(),
      tokenUsage: this.tokenUsage(),
    };

    if (this.chatId) {
      await this.storageService.saveChat(chatSession as ChatSession);
    }
  }

  private handleError(error: any): void {
    const errorType = error.type || ChatErrorType.UNKNOWN;

    // Log full error to console
    console.error('Chat error details:', error);

    // Show user-friendly message in snackbar
    switch (errorType) {
      case ChatErrorType.CONTEXT_WINDOW_EXCEEDED:
        this.snackbarService.error('Context limit reached. Please start a new conversation.', 6000);
        break;

      case ChatErrorType.SESSION_ERROR:
        this.snackbarService.error('Session error occurred. Please refresh the page.', 5000);
        break;

      case ChatErrorType.API_UNAVAILABLE:
        this.snackbarService.error('API is currently unavailable. Please try again later.', 5000);
        break;

      default:
        this.snackbarService.error('Failed to generate response. Please try again.', 4000);
    }
  }

  private updateTokenUsage(): void {
    const usage = this.promptApiService.getTokenUsage();
    this.tokenUsage.set(usage.usage);
    this.tokenQuota.set(usage.quota);

    // Warn if approaching limit (80%)
    if (usage.quota > 0 && usage.usage / usage.quota > 0.8) {
      this.snackbarService.warning(
        'Approaching context limit. Consider starting a new conversation soon.',
        5000
      );
    }
  }

  // Modified newChat to just reset state as it is handled by routing for "New Chat" button
  newChat(): void {
    this.chatId = null;
    this.chatTitle = 'New Chat';
    this.messages.set([]);
    this.tokenUsage.set(0);
    this.tokenQuota.set(0);
    this.promptApiService.destroySession();
    this.promptApiService
      .createSession()
      .catch((err) => console.error('Failed to create session', err));
  }

  clearChat(): void {
    if (confirm('Are you sure you want to clear this chat?')) {
      if (this.chatId) {
        this.storageService.deleteChat(this.chatId).then(() => {
          this.router.navigate(['/']);
        });
      } else {
        this.newChat();
      }
    }
  }

  getTokenPercentage(): number {
    if (this.tokenQuota() === 0) return 0;
    return (this.tokenUsage() / this.tokenQuota()) * 100;
  }

  getTokenColor(): string {
    const percentage = this.getTokenPercentage();
    if (percentage > 80) return 'warn';
    if (percentage > 60) return 'accent';
    return 'primary';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
