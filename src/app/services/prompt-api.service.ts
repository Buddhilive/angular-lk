import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AILanguageModelFactory,
  AILanguageModel,
  AIModelAvailability,
  AILanguageModelParams,
} from '../types/prompt-api.types';
import { ChatError, ChatErrorType } from '../models/chat.models';

@Injectable({
  providedIn: 'root',
})
export class PromptApiService {
  private session: AILanguageModel | null = null;

  private downloadProgressSubject = new BehaviorSubject<number>(0);
  public downloadProgress$ = this.downloadProgressSubject.asObservable();

  /**
   * Check if browser supports the Prompt API
   */
  isBrowserSupported(): boolean {
    console.log('Checking browser support...');
    console.log(
      'window.LanguageModel exists:',
      typeof window !== 'undefined' && 'LanguageModel' in window
    );

    const supported = typeof window !== 'undefined' && 'LanguageModel' in window;

    console.log('Browser supported:', supported);
    return supported;
  }

  /**
   * Check API availability
   * Returns: 'readily', 'after-download', or 'no'
   */
  async checkAvailability(): Promise<AIModelAvailability> {
    if (!this.isBrowserSupported()) {
      throw this.createError(
        ChatErrorType.BROWSER_UNSUPPORTED,
        'Your browser does not support the Chrome Prompt API. Please use Chrome with the required flags enabled.'
      );
    }

    try {
      const availability = await window.LanguageModel!.availability();
      console.log('Prompt API availability:', availability);
      return availability;
    } catch (error) {
      console.error('Error checking API availability:', error);
      throw this.createError(
        ChatErrorType.API_UNAVAILABLE,
        'Failed to check API availability',
        error
      );
    }
  }

  /**
   * Get model parameters
   */
  async getModelParams(): Promise<AILanguageModelParams> {
    if (!window.LanguageModel) {
      throw this.createError(ChatErrorType.BROWSER_UNSUPPORTED, 'Language model not available');
    }

    try {
      return await window.LanguageModel.params();
    } catch (error) {
      console.error('Error getting model params:', error);
      throw this.createError(
        ChatErrorType.API_UNAVAILABLE,
        'Failed to get model parameters',
        error
      );
    }
  }

  /**
   * Create a new AI session
   */
  async createSession(): Promise<void> {
    if (!window.LanguageModel) {
      throw this.createError(ChatErrorType.BROWSER_UNSUPPORTED, 'Language model not available');
    }

    try {
      // Get model parameters for default values
      const params = await this.getModelParams();

      // Create session with download progress monitoring
      this.session = await window.LanguageModel.create({
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            const progress = e.loaded * 100;
            console.log(`Model download progress: ${progress.toFixed(2)}%`);
            this.downloadProgressSubject.next(progress);
          });
        },
        temperature: params.defaultTemperature,
        topK: params.defaultTopK,
      });

      console.log('AI session created successfully');
    } catch (error) {
      console.error('Error creating session:', error);
      throw this.createError(ChatErrorType.SESSION_ERROR, 'Failed to create AI session', error);
    }
  }

  /**
   * Send a prompt and get streaming response
   */
  async promptStreaming(message: string): Promise<AsyncIterable<string>> {
    if (!this.session) {
      throw this.createError(
        ChatErrorType.SESSION_ERROR,
        'No active session. Please create a session first.'
      );
    }

    try {
      const stream = this.session.promptStreaming(message);
      return stream;
    } catch (error) {
      console.error('Error during streaming prompt:', error);

      // Check if it's a context window error
      if (this.isContextWindowError(error)) {
        throw this.createError(
          ChatErrorType.CONTEXT_WINDOW_EXCEEDED,
          'Context limit reached. Please start a new conversation.',
          error
        );
      }

      throw this.createError(ChatErrorType.UNKNOWN, 'Failed to generate response', error);
    }
  }

  /**
   * Send a prompt and get non-streaming response
   */
  async prompt(message: string): Promise<string> {
    if (!this.session) {
      throw this.createError(
        ChatErrorType.SESSION_ERROR,
        'No active session. Please create a session first.'
      );
    }

    try {
      return await this.session.prompt(message);
    } catch (error) {
      console.error('Error during prompt:', error);

      if (this.isContextWindowError(error)) {
        throw this.createError(
          ChatErrorType.CONTEXT_WINDOW_EXCEEDED,
          'Context limit reached. Please start a new conversation.',
          error
        );
      }

      throw this.createError(ChatErrorType.UNKNOWN, 'Failed to generate response', error);
    }
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): { usage: number; quota: number } {
    if (!this.session) {
      return { usage: 0, quota: 0 };
    }

    return {
      usage: this.session.inputUsage,
      quota: this.session.inputQuota,
    };
  }

  /**
   * Clone the current session
   */
  async cloneSession(): Promise<void> {
    if (!this.session) {
      throw this.createError(ChatErrorType.SESSION_ERROR, 'No active session to clone');
    }

    try {
      this.session = await this.session.clone();
      console.log('Session cloned successfully');
    } catch (error) {
      console.error('Error cloning session:', error);
      throw this.createError(ChatErrorType.SESSION_ERROR, 'Failed to clone session', error);
    }
  }

  /**
   * Destroy the current session
   */
  destroySession(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
      console.log('Session destroyed');
    }
  }

  /**
   * Check if error is related to context window
   */
  private isContextWindowError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('context') ||
      errorMessage.includes('token') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('limit')
    );
  }

  /**
   * Create a structured error object
   */
  private createError(type: ChatErrorType, message: string, details?: any): ChatError {
    return {
      type,
      message,
      details,
    };
  }

  /**
   * Check if session exists
   */
  hasActiveSession(): boolean {
    return this.session !== null;
  }
}
