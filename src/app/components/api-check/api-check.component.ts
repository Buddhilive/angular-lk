import { Component, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromptApiService } from '../../services/prompt-api.service';
import { ApiStatus } from '../../models/chat.models';

@Component({
  selector: 'app-api-check',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './api-check.component.html',
  styleUrl: './api-check.component.css',
})
export class ApiCheckComponent implements OnInit {
  private promptApiService = inject(PromptApiService);

  @Output() statusChange = new EventEmitter<ApiStatus>();

  status = signal<ApiStatus>('checking');
  errorMessage = signal<string>('');
  downloadProgress = signal<number>(0);

  async ngOnInit() {
    await this.checkApiAvailability();
  }

  async checkApiAvailability() {
    this.status.set('checking');
    this.errorMessage.set('');

    try {
      // Check browser support
      if (!this.promptApiService.isBrowserSupported()) {
        this.status.set('unsupported');
        this.errorMessage.set(
          'Your browser does not support the Chrome Prompt API. Please use Chrome with the required flags enabled.'
        );
        return;
      }

      // Check API availability
      const availability = await this.promptApiService.checkAvailability();

      if (availability === 'no') {
        this.status.set('unavailable');
        this.errorMessage.set(
          'The Prompt API is not available on this device. Please check if your device meets the hardware requirements.'
        );
        return;
      }

      if (availability === 'after-download') {
        this.status.set('downloading');

        // Subscribe to download progress
        this.promptApiService.downloadProgress$.subscribe((progress) => {
          this.downloadProgress.set(progress);
        });
      }

      // Create session
      await this.promptApiService.createSession();
      this.status.set('ready');
      this.statusChange.emit('ready');
    } catch (error: any) {
      console.error('API check failed:', error);
      this.status.set('unavailable');
      this.errorMessage.set(
        error.message || 'Failed to initialize the Prompt API. Please try again.'
      );
    }
  }

  async retry() {
    await this.checkApiAvailability();
  }

  getStatusIcon(): string {
    switch (this.status()) {
      case 'ready':
        return 'check_circle';
      case 'unavailable':
      case 'unsupported':
        return 'error';
      case 'downloading':
        return 'download';
      default:
        return 'hourglass_empty';
    }
  }

  getStatusColor(): string {
    switch (this.status()) {
      case 'ready':
        return 'text-green-500';
      case 'unavailable':
      case 'unsupported':
        return 'text-red-500';
      case 'downloading':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }
}
