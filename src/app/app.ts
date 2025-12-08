import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiCheckComponent } from './components/api-check/api-check.component';
import { ChatContainerComponent } from './components/chat-container/chat-container.component';
import { ApiStatus } from './models/chat.models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApiCheckComponent, ChatContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('AI Chat - Chrome Built-in AI');
  protected readonly apiStatus = signal<ApiStatus>('checking');

  onApiStatusChange(status: ApiStatus): void {
    this.apiStatus.set(status);
  }
}
