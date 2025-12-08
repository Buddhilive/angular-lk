import { Component, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css',
})
export class MessageInputComponent {
  @Input() disabled = false;
  @Output() sendMessage = new EventEmitter<string>();

  message = signal<string>('');

  onSend(): void {
    const msg = this.message().trim();
    if (msg && !this.disabled) {
      this.sendMessage.emit(msg);
      this.message.set('');
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Send on Enter, new line on Shift+Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  updateMessage(value: string): void {
    this.message.set(value);
  }
}
