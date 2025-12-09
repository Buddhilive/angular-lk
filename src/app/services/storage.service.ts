import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatSession, ChatSessionMetadata } from '../models/chat.models';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private dbName = 'AIChatDB';
  private storeName = 'chats';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private chatsSubject = new BehaviorSubject<ChatSessionMetadata[]>([]);
  public chats$ = this.chatsSubject.asObservable();

  constructor() {
    this.initDB().then(() => this.loadChatsMetadata());
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event);
        reject('Database error');
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  async saveChat(chat: ChatSession): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(chat);

      request.onsuccess = () => {
        this.loadChatsMetadata(); // Refresh list
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getChat(id: string): Promise<ChatSession | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async loadChatsMetadata(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results: ChatSessionMetadata[] = [];

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          const { id, title, timestamp } = cursor.value;
          results.push({ id, title, timestamp });
          cursor.continue();
        } else {
          this.chatsSubject.next(results);
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChat(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.loadChatsMetadata(); // Refresh list
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}
