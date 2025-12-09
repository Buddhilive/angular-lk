import { Component, signal, inject, ViewChild, effect } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { AsyncPipe } from '@angular/common';
import { ApiCheckComponent } from './components/api-check/api-check.component';
import { ChatContainerComponent } from './components/chat-container/chat-container.component';
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { ApiStatus } from './models/chat.models';
import { StorageService } from './services/storage.service';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ApiCheckComponent, RouterOutlet, MatSidenavModule, ChatSidebarComponent, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  private storageService = inject(StorageService);
  public layoutService = inject(LayoutService);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  protected readonly title = signal('AI Chat - Chrome Built-in AI');
  protected readonly apiStatus = signal<ApiStatus>('checking');

  chats$ = this.storageService.chats$;

  constructor() {
    effect(() => {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError if needed
      // or just ensure this runs after init.
      // Effect runs asynchronously usually.
      const isOpen = this.layoutService.isSidenavOpen();
      if (this.sidenav) {
        if (isOpen) {
          this.sidenav.open();
        } else {
          this.sidenav.close();
        }
      }
    });
  }

  onApiStatusChange(status: ApiStatus): void {
    this.apiStatus.set(status);
  }

  onChatSelect(id: string): void {
    this.router.navigate(['/chat', id]);
    if (window.innerWidth < 768) {
      this.layoutService.setSidenavOpen(false);
    }
  }

  onNewChat(): void {
    this.router.navigate(['/']);
    if (window.innerWidth < 768) {
      this.layoutService.setSidenavOpen(false);
    }
  }

  onDeleteChat(id: string): void {
    if (confirm('Are you sure you want to delete this chat?')) {
      this.storageService.deleteChat(id).then(() => {
        // If we deleted the current chat, navigate to new chat
        const currentUrl = this.router.url;
        if (currentUrl.includes(id)) {
          this.router.navigate(['/']);
        }
      });
    }
  }
}
