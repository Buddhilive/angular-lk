/**
 * Chat message model
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  tokenUsage: number;
  tokenQuota: number;
}

/**
 * API status
 */
export type ApiStatus = 'checking' | 'ready' | 'downloading' | 'unavailable' | 'unsupported';

/**
 * Error types for better error handling
 */
export enum ChatErrorType {
  CONTEXT_WINDOW_EXCEEDED = 'CONTEXT_WINDOW_EXCEEDED',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  BROWSER_UNSUPPORTED = 'BROWSER_UNSUPPORTED',
  SESSION_ERROR = 'SESSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Chat error with type and details
 */
export interface ChatError {
  type: ChatErrorType;
  message: string;
  details?: any;
}

/**
 * Chat session metadata for the list view
 */
export interface ChatSessionMetadata {
  id: string;
  title: string;
  timestamp: Date;
}

/**
 * Full chat session with messages
 */
export interface ChatSession extends ChatSessionMetadata {
  messages: ChatMessage[];
  tokenUsage: number;
}
