import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ArticleSession, SessionSummary } from '../models/article-session.model';
import { environment } from '../../environments/environment';

export interface GithubSaveResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface GithubFile {
  name: string;
  path: string;
  sha: string;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private readonly API_URL = environment.githubApiUrl;
  private readonly REPO_OWNER = environment.githubRepoOwner;
  private readonly REPO_NAME = environment.githubRepoName;

  constructor(private http: HttpClient) {}

  listSessions(token: string): Observable<SessionSummary[]> {
    const url = `${this.API_URL}/${this.REPO_OWNER}/${this.REPO_NAME}/contents/sessions`;
    const headers = new HttpHeaders({
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<GithubFile[]>(url, { headers }).pipe(
      switchMap(files => {
        const jsonFiles = files.filter(f => f.name.endsWith('.json'));
        if (jsonFiles.length === 0) {
          return of([]);
        }

        const loadObservables = jsonFiles.map(file => this.loadSessionContent(token, file));
        return forkJoin(loadObservables).pipe(
          map(results => {
            const summaries: SessionSummary[] = results.map((result, idx) => {
              const file = jsonFiles[idx];
              const session = result.session;
              return {
                name: file.name,
                path: file.path,
                sha: file.sha,
                title: session.title,
                createdAt: session.createdAt,
                totalSentences: session.totalSentences,
                translatedCount: session.translatedCount,
                completed: session.completed,
                averageScore: session.averageScore || 0
              };
            });
            return summaries.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          })
        );
      }),
      catchError(err => {
        if (err.status === 404) {
          return of([]);
        }
        return throwError(() => new Error(err.message || 'Failed to list sessions'));
      })
    );
  }

  private loadSessionContent(token: string, file: GithubFile): Observable<{ file: GithubFile; session: ArticleSession }> {
    const url = `${this.API_URL}/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${file.path}`;
    const headers = new HttpHeaders({
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => ({
        file,
        session: JSON.parse(this.decodeBase64(response.content)) as ArticleSession
      })),
      catchError(() => {
        return of({
          file,
          session: {
            title: file.name,
            originalText: '',
            sentences: [],
            createdAt: new Date().toISOString(),
            totalSentences: 0,
            translatedCount: 0,
            completed: false,
            averageScore: 0
          }
        });
      })
    );
  }

  loadSession(token: string, path: string): Observable<ArticleSession> {
    const url = `${this.API_URL}/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${path}`;
    const headers = new HttpHeaders({
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const content = this.decodeBase64(response.content);
        return JSON.parse(content) as ArticleSession;
      }),
      catchError(err => {
        return throwError(() => new Error(err.message || 'Failed to load session'));
      })
    );
  }

  saveSession(token: string, session: ArticleSession, existingPath?: string): Observable<GithubSaveResult> {
    const slug = this.slugify(session.title);
    const timestamp = Date.now();
    const filename = existingPath || `sessions/${timestamp}-${slug}.json`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(session, null, 2))));

    const getUrl = `${this.API_URL}/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${filename}`;
    const putUrl = `${this.API_URL}/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${filename}`;

    const headers = new HttpHeaders({
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any>(getUrl, { headers }).pipe(
      catchError(err => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => new Error(err.message || 'Failed to check file existence'));
      }),
      switchMap(existingFile => {
        const body: any = {
          message: `Update translation session: ${session.title}`,
          content
        };
        if (existingFile && existingFile.sha) {
          body.sha = existingFile.sha;
        }

        return this.http.put(putUrl, body, { headers }).pipe(
          map(() => ({
            success: true,
            url: `https://github.com/${this.REPO_OWNER}/${this.REPO_NAME}/blob/main/${filename}`
          })),
          catchError(err => {
            let errorMsg = 'Failed to save session';
            if (err.status === 401) {
              errorMsg = 'Invalid GitHub token';
            } else if (err.status === 404) {
              errorMsg = 'Repository not found. Please create the repo first.';
            } else if (err.status === 422) {
              errorMsg = 'Invalid request. Check if repo exists and token has correct permissions.';
            }
            return of({ success: false, error: errorMsg });
          })
        );
      })
    );
  }

  private decodeBase64(base64: string): string {
    return decodeURIComponent(escape(atob(base64)));
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 50);
  }
}
