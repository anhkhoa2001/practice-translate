import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-api-key-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-key-setup.component.html',
  styleUrl: './api-key-setup.component.css'
})
export class ApiKeySetupComponent {
  @Output() keysConfigured = new EventEmitter<{ geminiKey: string; githubToken: string }>();

  geminiKey = '';
  githubToken = '';
  geminiError = '';
  githubError = '';

  constructor(private storageService: StorageService) {}

  onSubmit(): void {
    this.geminiError = '';
    this.githubError = '';

    if (!this.geminiKey.trim()) {
      this.geminiError = 'Vui lòng nhập Gemini API Key';
      return;
    }

    if (!this.githubToken.trim()) {
      this.githubError = 'Vui lòng nhập GitHub Personal Access Token';
      return;
    }

    this.storageService.setApiKey(this.geminiKey.trim());
    this.storageService.setGithubToken(this.githubToken.trim());
    this.keysConfigured.emit({
      geminiKey: this.geminiKey.trim(),
      githubToken: this.githubToken.trim()
    });
  }
}
