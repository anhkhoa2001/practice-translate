import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionSummary } from '../../models/article-session.model';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.css'
})
export class SessionListComponent {
  @Input() sessions: SessionSummary[] = [];
  @Input() isLoading = false;

  @Output() continueSession = new EventEmitter<SessionSummary>();
  @Output() createNew = new EventEmitter<void>();

  trackByPath(index: number, session: SessionSummary): string {
    return session.path;
  }

  getScoreClass(score: number): string {
    if (score < 5) return 'low';
    if (score <= 7) return 'medium';
    return 'high';
  }

  getProgressPercent(session: SessionSummary): number {
    if (session.totalSentences === 0) return 0;
    return Math.round((session.translatedCount / session.totalSentences) * 100);
  }

  formatDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }
}
