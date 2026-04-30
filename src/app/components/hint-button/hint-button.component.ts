import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-hint-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hint-button.component.html',
  styleUrl: './hint-button.component.css'
})
export class HintButtonComponent {
  @Input() original = '';
  @Input() apiKey = '';
  @Output() keywordsReceived = new EventEmitter<string[]>();

  isLoading = false;
  error = '';

  constructor(private geminiService: GeminiService) {}

  onClick(): void {
    if (!this.original || !this.apiKey) return;

    this.isLoading = true;
    this.error = '';

    this.geminiService.getKeywords(this.apiKey, this.original).subscribe({
      next: (keywords) => {
        this.isLoading = false;
        this.keywordsReceived.emit(keywords);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message || 'Không thể lấy gợi ý';
      }
    });
  }
}
