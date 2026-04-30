import { Feedback } from './feedback.model';

export interface Sentence {
  id: number;
  original: string;
  translation: string;
  feedback: Feedback[];
  keywords: string[];
  status: 'pending' | 'translated';
  score?: number;
}
