import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatSessionMetadata } from '../../models/chat.models';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, RouterModule, DatePipe],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.css',
})
export class ChatSidebarComponent {
  @Input() chats: ChatSessionMetadata[] = [];
  @Input() currentChatId: string | null = null;
  @Output() selectChat = new EventEmitter<string>();
  @Output() deleteChat = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();

  onSelect(id: string): void {
    this.selectChat.emit(id);
  }

  onDelete(event: Event, id: string): void {
    event.stopPropagation();
    this.deleteChat.emit(id);
  }

  onNewChat(): void {
    this.newChat.emit();
  }
}
