import { Component, Input, ElementRef, ViewChild, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatMessage } from '../../models/chat.models';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.css',
})
export class MessageListComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private shouldScroll = signal(false);

  ngAfterViewChecked() {
    if (this.shouldScroll()) {
      this.scrollToBottom();
      this.shouldScroll.set(false);
    }
  }

  ngOnChanges() {
    this.shouldScroll.set(true);
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  getMessageClass(role: string): string {
    return role === 'user' ? 'message-user' : 'message-assistant';
  }

  getMessageAlignment(role: string): string {
    return role === 'user' ? 'justify-end' : 'justify-start';
  }
}
