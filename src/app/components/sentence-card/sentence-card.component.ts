import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sentence } from '../../models/sentence.model';
import { Feedback } from '../../models/feedback.model';
import { VocabularyItem } from '../../models/vocabulary.model';
import { FeedbackPanelComponent } from '../feedback-panel/feedback-panel.component';
import { HintButtonComponent } from '../hint-button/hint-button.component';

@Component({
  selector: 'app-sentence-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackPanelComponent, HintButtonComponent],
  templateUrl: './sentence-card.component.html',
  styleUrl: './sentence-card.component.css'
})
export class SentenceCardComponent {
  @Input() sentence!: Sentence;
  @Input() isActive = false;
  @Input() isLoading = false;
  @Input() feedback: Feedback[] = [];
  @Input() keywords: string[] = [];
  @Input() suggestion = '';
  @Input() score: number | null = null;
  @Input() apiKey = '';

  @Output() submitTranslation = new EventEmitter<string>();
  @Output() keywordsReceived = new EventEmitter<string[]>();
  @Output() lookupVocabulary = new EventEmitter<string>();

  vocabInput = '';
  currentVocab: VocabularyItem | null = null;
  isVocabLoading = false;
  vocabError = '';

  onSubmit(): void {
    this.submitTranslation.emit(this.sentence.translation);
  }

  onKeywordsReceived(keywords: string[]): void {
    this.keywordsReceived.emit(keywords);
  }

  onTranslationChange(value: string): void {
    this.sentence.translation = value;
  }

  onLookupVocabulary(): void {
    const word = this.vocabInput.trim();
    if (!word) return;
    this.lookupVocabulary.emit(word);
    this.vocabInput = '';
  }

  setVocabResult(result: VocabularyItem | null, error: string = ''): void {
    this.currentVocab = result;
    this.vocabError = error;
    this.isVocabLoading = false;
  }

  setVocabLoading(loading: boolean): void {
    this.isVocabLoading = loading;
    if (loading) {
      this.currentVocab = null;
      this.vocabError = '';
    }
  }
}
