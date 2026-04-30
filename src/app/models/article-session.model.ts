import { Sentence } from './sentence.model';

export interface ArticleSession {
  title: string;
  originalText: string;
  sentences: Sentence[];
  createdAt: string;
  totalSentences: number;
  translatedCount: number;
  completed: boolean;
  averageScore: number;
}

export interface SessionSummary {
  name: string;
  path: string;
  sha: string;
  title: string;
  createdAt: string;
  totalSentences: number;
  translatedCount: number;
  completed: boolean;
  averageScore: number;
}
