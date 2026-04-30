export interface Feedback {
  type: 'good' | 'error';
  message: string;
}

export interface EvaluationResult {
  feedback: Feedback[];
  suggestion: string;
  score: number;
}
