import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyItem } from '../../models/vocabulary.model';

@Component({
  selector: 'app-vocabulary-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vocabulary-list.component.html',
  styleUrl: './vocabulary-list.component.css'
})
export class VocabularyListComponent {
  @Input() items: VocabularyItem[] = [];
  @Input() isLoading = false;

  formatDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  }

  trackByWord(index: number, item: VocabularyItem): string {
    return item.word + item.createdAt;
  }
}
