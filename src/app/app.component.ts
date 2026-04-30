import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from './services/storage.service';
import { ApiKeySetupComponent } from './components/api-key-setup/api-key-setup.component';
import { PracticeContainerComponent } from './components/practice-container/practice-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ApiKeySetupComponent, PracticeContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  hasKeys = signal(false);

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    const geminiKey = this.storageService.getApiKey();
    const githubToken = this.storageService.getGithubToken();
    this.hasKeys.set(!!geminiKey && !!githubToken);
  }

  onKeysConfigured(): void {
    this.hasKeys.set(true);
  }
}
