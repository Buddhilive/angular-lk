import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { PromptApiService } from '../../services/prompt-api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ChatMessage, ChatErrorType } from '../../models/chat.models';

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
export class ChatContainerComponent {
  private promptApiService = inject(PromptApiService);
  private snackbarService = inject(SnackbarService);

  messages = signal<ChatMessage[]>([]);
  isLoading = signal<boolean>(false);
  tokenUsage = signal<number>(0);
  tokenQuota = signal<number>(0);

  async onSendMessage(content: string): Promise<void> {
    if (!content.trim() || this.isLoading()) {
      return;
    }

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

  private handleError(error: any): void {
    const errorType = error.type || ChatErrorType.UNKNOWN;
    const errorMessage = error.message || 'An unexpected error occurred';

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

  clearChat(): void {
    this.messages.set([]);
    this.tokenUsage.set(0);
    this.tokenQuota.set(0);
    this.snackbarService.info('Chat cleared');
  }

  newChat(): void {
    // Destroy current session and create new one
    this.promptApiService.destroySession();
    this.clearChat();

    // Create new session
    this.promptApiService
      .createSession()
      .then(() => {
        this.snackbarService.success('New chat started');
      })
      .catch((error) => {
        console.error('Error creating new session:', error);
        this.snackbarService.error('Failed to start new chat');
      });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
}
