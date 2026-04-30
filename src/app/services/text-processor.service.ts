import { Injectable } from '@angular/core';
import { Sentence } from '../models/sentence.model';

@Injectable({
  providedIn: 'root'
})
export class TextProcessorService {
  splitToSentences(text: string): Sentence[] {
    if (!text || !text.trim()) {
      return [];
    }

    const sentences: Sentence[] = [];
    let id = 0;

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
        const segments = segmenter.segment(text);
        for (const seg of Array.from(segments)) {
          const sentence = seg.segment.trim();
          if (sentence && sentence.length > 0) {
            sentences.push(this.createSentence(id++, sentence));
          }
        }
        return sentences;
      } catch (e) {
        console.warn('Intl.Segmenter failed, using fallback', e);
      }
    }

    return this.splitByRegex(text, id);
  }

  private splitByRegex(text: string, startId: number): Sentence[] {
    const sentences: Sentence[] = [];
    const regex = /[^.!?]*[.!?]+(?:\s+|$)|[^.!?]+$/g;
    const matches = text.match(regex);

    if (matches) {
      let id = startId;
      for (const match of matches) {
        const sentence = match.trim();
        if (sentence) {
          sentences.push(this.createSentence(id++, sentence));
        }
      }
    }

    if (sentences.length === 0 && text.trim()) {
      sentences.push(this.createSentence(startId, text.trim()));
    }

    return sentences;
  }

  private createSentence(id: number, original: string): Sentence {
    return {
      id,
      original,
      translation: '',
      feedback: [],
      keywords: [],
      status: 'pending'
    };
  }
}
