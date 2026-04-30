import { Injectable } from '@angular/core';
import { Sentence } from '../models/sentence.model';
import { Feedback } from '../models/feedback.model';

export interface ArticleSession {
  title: string;
  originalText: string;
  sentences: Sentence[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly GEMINI_API_KEY = 'gemini_api_key';
  private readonly GITHUB_TOKEN = 'github_token';

  getApiKey(): string | null {
    return localStorage.getItem(this.GEMINI_API_KEY);
  }

  setApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem(this.GEMINI_API_KEY, key.trim());
    }
  }

  clearApiKey(): void {
    localStorage.removeItem(this.GEMINI_API_KEY);
  }

  getGithubToken(): string | null {
    return localStorage.getItem(this.GITHUB_TOKEN);
  }

  setGithubToken(token: string): void {
    if (token && token.trim()) {
      localStorage.setItem(this.GITHUB_TOKEN, token.trim());
    }
  }

  clearGithubToken(): void {
    localStorage.removeItem(this.GITHUB_TOKEN);
  }
}
