import { Component, signal, computed, HostListener, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sentence } from '../../models/sentence.model';
import { Feedback } from '../../models/feedback.model';
import { ArticleSession } from '../../models/article-session.model';
import { TextProcessorService } from '../../services/text-processor.service';
import { GeminiService } from '../../services/gemini.service';
import { GithubService } from '../../services/github.service';
import { StorageService } from '../../services/storage.service';
import { SentenceCardComponent } from '../sentence-card/sentence-card.component';
import { FeedbackPanelComponent } from '../feedback-panel/feedback-panel.component';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, SentenceCardComponent, FeedbackPanelComponent],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.css'
})
export class ReaderComponent implements OnInit, OnChanges {
  @Input() existingSession: ArticleSession | null = null;
  @Input() existingPath: string | null = null;
  @Output() backToList = new EventEmitter<void>();
  @Output() sessionSaved = new EventEmitter<string>();

  originalText = '';
  title = '';
  sentences = signal<Sentence[]>([]);
  currentIndex = signal(0);
  isLoading = signal(false);
  currentFeedback = signal<Feedback[]>([]);
  currentKeywords = signal<string[]>([]);
  currentSuggestion = signal('');
  currentScore = signal<number | null>(null);
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  maxTextLength = 10000;

  constructor(
    private textProcessorService: TextProcessorService,
    private geminiService: GeminiService,
    private githubService: GithubService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.restoreFromSession();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingSession'] && this.existingSession) {
      this.restoreFromSession();
    }
  }

  private restoreFromSession(): void {
    if (!this.existingSession) return;

    this.title = this.existingSession.title;
    this.originalText = this.existingSession.originalText;
    this.sentences.set(this.existingSession.sentences || []);
    this.currentIndex.set(this.findFirstPendingIndex());
    this.currentFeedback.set([]);
    this.currentKeywords.set([]);
    this.currentSuggestion.set('');
    this.currentScore.set(null);
    this.saveStatus.set('saved');
  }

  private findFirstPendingIndex(): number {
    const sents = this.existingSession?.sentences || [];
    const idx = sents.findIndex(s => s.status === 'pending');
    return idx >= 0 ? idx : 0;
  }

  currentSentence = computed(() => {
    const sents = this.sentences();
    const idx = this.currentIndex();
    return sents[idx] || null;
  });

  isFirst = computed(() => this.currentIndex() === 0);
  isLast = computed(() => {
    const sents = this.sentences();
    return this.currentIndex() >= sents.length - 1;
  });

  totalSentences = computed(() => this.sentences().length);
  translatedCount = computed(() => this.sentences().filter(s => s.status === 'translated').length);
  completed = computed(() => this.translatedCount() === this.totalSentences() && this.totalSentences() > 0);
  averageScore = computed(() => {
    const translated = this.sentences().filter(s => s.status === 'translated' && s.score != null);
    if (translated.length === 0) return 0;
    const sum = translated.reduce((acc, s) => acc + (s.score || 0), 0);
    return Math.round((sum / translated.length) * 10) / 10;
  });

  progressPercent = computed(() => {
    if (this.totalSentences() === 0) return 0;
    return Math.round((this.translatedCount() / this.totalSentences()) * 100);
  });

  onStart(): void {
    if (!this.originalText.trim() || !this.title.trim()) return;

    const sentences = this.textProcessorService.splitToSentences(this.originalText);
    this.sentences.set(sentences);
    this.currentIndex.set(0);
    this.currentFeedback.set([]);
    this.currentKeywords.set([]);
    this.currentSuggestion.set('');

    this.saveSession();
  }

  private saveSession(): void {
    const token = this.storageService.getGithubToken();
    if (!token) return;

    this.saveStatus.set('saving');

    const session: ArticleSession = {
      title: this.title,
      originalText: this.originalText,
      sentences: this.sentences(),
      createdAt: this.existingSession?.createdAt || new Date().toISOString(),
      totalSentences: this.totalSentences(),
      translatedCount: this.translatedCount(),
      completed: this.completed(),
      averageScore: this.averageScore()
    };

    this.githubService.saveSession(token, session, this.existingPath || undefined).subscribe({
      next: (result) => {
        if (result.success) {
          this.saveStatus.set('saved');
          if (result.url) {
            const path = this.existingPath || this.extractPathFromUrl(result.url);
            this.sessionSaved.emit(path);
          }
        } else {
          this.saveStatus.set('error');
        }
      },
      error: () => {
        this.saveStatus.set('error');
      }
    });
  }

  private extractPathFromUrl(url: string): string {
    const match = url.match(/blob\/main\/(.+)$/);
    return match ? match[1] : '';
  }

  onSubmitTranslation(translation: string): void {
    const sentence = this.currentSentence();
    if (!sentence || !translation.trim()) return;

    const apiKey = this.storageService.getApiKey();
    if (!apiKey) return;

    this.isLoading.set(true);

    this.geminiService.evaluateTranslation(apiKey, sentence.original, translation, this.originalText).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        this.currentFeedback.set(result.feedback);
        this.currentSuggestion.set(result.suggestion);
        this.currentScore.set(result.score);

        const sents = this.sentences();
        const idx = this.currentIndex();
        sents[idx] = {
          ...sents[idx],
          translation,
          feedback: result.feedback,
          score: result.score,
          status: 'translated'
        };
        this.sentences.set([...sents]);

        this.saveSession();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.currentFeedback.set([{ type: 'error', message: err.message || 'Lỗi khi nhận xét bản dịch' }]);
        this.currentSuggestion.set('');
      }
    });
  }

  onKeywordsReceived(keywords: string[]): void {
    this.currentKeywords.set(keywords);

    const sents = this.sentences();
    const idx = this.currentIndex();
    sents[idx] = { ...sents[idx], keywords };
    this.sentences.set([...sents]);
  }

  nextSentence(): void {
    if (this.isLast()) return;
    this.currentIndex.update(i => i + 1);
    this.currentFeedback.set([]);
    this.currentKeywords.set([]);
    this.currentSuggestion.set('');
    this.currentScore.set(null);
  }

  prevSentence(): void {
    if (this.isFirst()) return;
    this.currentIndex.update(i => i - 1);
    this.currentFeedback.set([]);
    this.currentKeywords.set([]);
    this.currentSuggestion.set('');
    this.currentScore.set(null);
  }

  onBack(): void {
    this.backToList.emit();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.prevSentence();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.nextSentence();
    }
  }
}
