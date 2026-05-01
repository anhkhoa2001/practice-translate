import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Feedback, EvaluationResult } from '../models/feedback.model';
import { VocabularyItem } from '../models/vocabulary.model';
import { environment } from '../../environments/environment';

export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly API_URL = environment.geminiApiUrl;

  constructor(private http: HttpClient) {}

  evaluateTranslation(
    apiKey: string,
    original: string,
    translation: string,
    fullText: string
  ): Observable<EvaluationResult> {
    const prompt = this.buildTranslationPrompt(original, translation, fullText);
    return this.callGemini(apiKey, prompt).pipe(
      map(response => this.parseEvaluationResponse(response)),
      catchError(error => {
        if (error instanceof GeminiApiError || error instanceof ParseError) {
          return throwError(() => error);
        }
        return throwError(() => new GeminiApiError(error.message || 'Network error'));
      })
    );
  }

  getKeywords(apiKey: string, original: string): Observable<string[]> {
    const prompt = this.buildKeywordsPrompt(original);
    return this.callGemini(apiKey, prompt).pipe(
      map(response => this.parseKeywordsResponse(response)),
      catchError(error => {
        if (error instanceof GeminiApiError || error instanceof ParseError) {
          return throwError(() => error);
        }
        return throwError(() => new GeminiApiError(error.message || 'Network error'));
      })
    );
  }

  lookupVocabulary(apiKey: string, word: string): Observable<VocabularyItem> {
    const prompt = this.buildVocabularyPrompt(word);
    return this.callGemini(apiKey, prompt).pipe(
      map(response => this.parseVocabularyResponse(response, word)),
      catchError(error => {
        if (error instanceof GeminiApiError || error instanceof ParseError) {
          return throwError(() => error);
        }
        return throwError(() => new GeminiApiError(error.message || 'Network error'));
      })
    );
  }

  private buildTranslationPrompt(original: string, translation: string, fullText: string): string {
    return `Bạn là một giáo viên dạy dịch thuật tiếng Anh sang tiếng Việt.
Hãy nhận xét bản dịch sau của học viên dựa trên ngữ cảnh của toàn bộ đoạn văn.

ĐOẠN VĂN GỐC (ngữ cảnh):
${fullText}

CÂU ĐANG DỊCH:
"${original}"

BẢN DỊCH CỦA HỌC VIÊN:
"${translation}"

Hãy nhận xét và đưa ra câu dịch mẫu tốt nhất. Trả lời dưới dạng JSON:
{
  "feedback": [
    {"type": "good", "message": "..."},
    {"type": "error", "message": "..."}
  ],
  "suggestion": "Câu dịch gợi ý hoàn chỉnh...",
  "score": 8.5
}

- type="good": Chỗ dịch đúng, tự nhiên
- type="error": Lỗi sai về ngữ pháp, từ vựng, hoặc diễn đạt không tự nhiên
- suggestion: Câu dịch hoàn chỉnh bằng tiếng Việt, dựa trên ngữ cảnh đoạn văn
- score: Điểm tổng thể bản dịch trên thang 0-10, dựa trên độ chính xác, độ tự nhiên, ngữ pháp và từ vựng`;
  }

  private buildKeywordsPrompt(original: string): string {
    return `Cho câu tiếng Anh sau: "${original}"
Hãy đưa ra 3-5 từ khóa quan trọng cần chú ý khi dịch sang tiếng Việt.
Trả lời dạng JSON: {"keywords": ["từ 1", "từ 2", ...]}`;
  }

  private buildVocabularyPrompt(word: string): string {
    return `Cho từ tiếng Anh sau: "${word}"
Hãy cung cấp thông tin chi tiết dưới dạng JSON:
{
  "word": "...", "phonetic": "...", "partOfSpeech": "...",
  "meaning": "...", "example": "..."
}
- phonetic: Phiên âm IPA (ví dụ: /əˈdres/)
- partOfSpeech: Loại từ tiếng Việt (danh từ, động từ, tính từ, trạng từ, v.v.)
- meaning: Nghĩa tiếng Việt ngắn gọn, dễ hiểu
- example: Một câu tiếng Anh ví dụ sử dụng từ đó (1-2 câu)
Chỉ trả lời đúng định dạng JSON, không giải thích thêm.`;
  }

  private callGemini(apiKey: string, prompt: string): Observable<any> {
    const url = `${this.API_URL}?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    return this.http.post(url, body);
  }

  private parseEvaluationResponse(response: any): EvaluationResult {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ParseError('No response text from Gemini');
      }
      const result = this.extractJson(text) as EvaluationResult;
      result.score = Number(result.score) || 0;
      return result;
    } catch (e) {
      if (e instanceof ParseError) {
        throw e;
      }
      throw new ParseError('Failed to parse evaluation response');
    }
  }

  private parseKeywordsResponse(response: any): string[] {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ParseError('No response text from Gemini');
      }
      const json = this.extractJson(text) as { keywords?: string[] };
      if (!json.keywords || !Array.isArray(json.keywords)) {
        throw new ParseError('Invalid keywords response format');
      }
      return json.keywords;
    } catch (e) {
      if (e instanceof ParseError) {
        throw e;
      }
      throw new ParseError('Failed to parse keywords response');
    }
  }

  private parseVocabularyResponse(response: any, word: string): VocabularyItem {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ParseError('No response text from Gemini');
      }
      const json = this.extractJson(text) as VocabularyItem;
      return {
        word: json.word || word,
        phonetic: json.phonetic || '',
        partOfSpeech: json.partOfSpeech || '',
        meaning: json.meaning || '',
        example: json.example || '',
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      if (e instanceof ParseError) {
        throw e;
      }
      throw new ParseError('Failed to parse vocabulary response');
    }
  }

  private extractJson(text: string): any {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|([\s\S]*)/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2];
      try {
        return JSON.parse(jsonStr.trim());
      } catch (e) {
        try {
          const braceMatch = jsonStr.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (braceMatch) {
            return JSON.parse(braceMatch[1]);
          }
        } catch (e2) {
          throw new ParseError('Failed to parse JSON from response');
        }
      }
    }
    throw new ParseError('No JSON found in response');
  }
}
