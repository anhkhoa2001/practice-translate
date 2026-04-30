import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Feedback } from '../../models/feedback.model';

@Component({
  selector: 'app-feedback-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-panel.component.html',
  styleUrl: './feedback-panel.component.css'
})
export class FeedbackPanelComponent {
  @Input() feedback: Feedback[] = [];
}
