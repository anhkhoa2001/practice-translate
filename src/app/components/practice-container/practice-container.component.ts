import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../services/github.service';
import { StorageService } from '../../services/storage.service';
import { SessionListComponent } from '../session-list/session-list.component';
import { ReaderComponent } from '../reader/reader.component';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';
import { SessionSummary, ArticleSession } from '../../models/article-session.model';
import { VocabularyItem } from '../../models/vocabulary.model';

@Component({
  selector: 'app-practice-container',
  standalone: true,
  imports: [CommonModule, SessionListComponent, ReaderComponent, VocabularyListComponent],
  templateUrl: './practice-container.component.html',
  styleUrl: './practice-container.component.css'
})
export class PracticeContainerComponent implements OnInit {
  activeTab = signal<'list' | 'practice' | 'vocabulary'>('list');
  sessions = signal<SessionSummary[]>([]);
  isLoadingSessions = signal(false);
  currentSession = signal<ArticleSession | null>(null);
  sessionPath = signal<string | null>(null);
  vocabItems = signal<VocabularyItem[]>([]);
  isLoadingVocab = signal(false);

  constructor(
    private githubService: GithubService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    const token = this.storageService.getGithubToken();
    if (!token) return;

    this.isLoadingSessions.set(true);
    this.githubService.listSessions(token).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.isLoadingSessions.set(false);
      },
      error: () => {
        this.isLoadingSessions.set(false);
      }
    });
  }

  loadVocabulary(): void {
    const token = this.storageService.getGithubToken();
    if (!token) return;

    this.isLoadingVocab.set(true);
    this.githubService.loadVocabulary(token).subscribe({
      next: (items) => {
        this.vocabItems.set(items);
        this.isLoadingVocab.set(false);
      },
      error: () => {
        this.isLoadingVocab.set(false);
      }
    });
  }

  onSelectVocabularyTab(): void {
    this.activeTab.set('vocabulary');
    this.loadVocabulary();
  }

  onSelectListTab(): void {
    if (this.activeTab() !== 'list') {
      this.loadSessions();
      this.activeTab.set('list');
    }
  }

  onContinueSession(summary: SessionSummary): void {
    const token = this.storageService.getGithubToken();
    if (!token) return;

    this.isLoadingSessions.set(true);
    this.githubService.loadSession(token, summary.path).subscribe({
      next: (session) => {
        this.currentSession.set(session);
        this.sessionPath.set(summary.path);
        this.activeTab.set('practice');
        this.isLoadingSessions.set(false);
      },
      error: () => {
        this.isLoadingSessions.set(false);
      }
    });
  }

  onCreateNew(): void {
    this.currentSession.set(null);
    this.sessionPath.set(null);
    this.activeTab.set('practice');
  }

  onBackToList(): void {
    this.currentSession.set(null);
    this.sessionPath.set(null);
    this.activeTab.set('list');
    this.loadSessions();
  }

  onSessionSaved(path: string): void {
    this.sessionPath.set(path);
    this.loadSessions();
  }
}
