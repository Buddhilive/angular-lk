/**
 * TypeScript type definitions for Chrome Built-in AI Prompt API
 * Based on: https://developer.chrome.com/docs/ai/prompt-api
 */

export type AIModelAvailability = 'readily' | 'after-download' | 'no';

export interface AILanguageModelFactory {
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
  availability(): Promise<AIModelAvailability>;
  params(): Promise<AILanguageModelParams>;
}

export interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  systemPrompt?: string;
  initialPrompts?: AILanguageModelPrompt[];
  topK?: number;
  temperature?: number;
}

export interface AILanguageModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

export interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

export interface AICreateMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
  removeEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
}

export interface AILanguageModel {
  prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: AILanguageModelPromptOptions): ReadableStream<string>;
  countPromptTokens(input: string): Promise<number>;
  clone(): Promise<AILanguageModel>;
  destroy(): void;
  readonly inputUsage: number;
  readonly inputQuota: number;
}

export interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

export interface AILanguageModelPrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Extend Window interface to include AI API
declare global {
  interface Window {
    LanguageModel?: AILanguageModelFactory;
  }
}
