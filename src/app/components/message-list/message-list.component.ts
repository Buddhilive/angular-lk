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

  private shouldScroll = signal(false);

  constructor(private elementRef: ElementRef) {}

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
      const element = this.elementRef.nativeElement;
      element.scrollTop = element.scrollHeight;
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
