import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SummarizerService {
  private summarizer: any = null;
  public isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  async checkAvailability(): Promise<void> {
    if ('ai' in self && 'summarizer' in (self as any).ai) {
      const capabilities = await (self as any).ai.summarizer.capabilities();
      this.isAvailable = capabilities.available !== 'no';
    } else {
      this.isAvailable = false;
    }
  }

  async summarize(text: string): Promise<string> {
    if (!this.isAvailable) {
      return this.generateFallbackTitle(text);
    }

    try {
      if (!this.summarizer) {
        this.summarizer = await (self as any).ai.summarizer.create({
          type: 'headline',
          format: 'plain-text',
          length: 'short',
        });
      }

      const summary = await this.summarizer.summarize(text);
      return summary.trim();
    } catch (error) {
      console.warn('Summarization failed, using fallback:', error);
      return this.generateFallbackTitle(text);
    }
  }

  private generateFallbackTitle(text: string): string {
    return text.substring(0, 30) + (text.length > 30 ? '...' : '');
  }
}
