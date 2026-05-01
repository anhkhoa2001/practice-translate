# AI Translation Practice - Agent Instructions

## Project Overview
Angular 17 standalone components app for practicing English-to-Vietnamese translation with Gemini AI feedback.

## Key Commands

```bash
npm start                            # Dev server at http://localhost:4200 (development config)
npm run build                        # Production build to dist/ (default configuration is production)
ng build --configuration=development # Development build
ng test                              # Karma unit tests (no spec files currently exist)
```

## Architecture

- **Angular 17 standalone components** with Signals for state management
- **Bootstrap**: `src/main.ts` uses `bootstrapApplication(AppComponent, appConfig)`
- **Location**: `src/app/` with subdirectories: `models/`, `services/`, `components/`
- **No NgModules** - all components are `standalone: true`
- **HttpClient** provided via `provideHttpClient()` in `src/app/app.config.ts`
- **Schematics**: all generators have `skipTests: true` by default (configured in `angular.json`)

## Configuration

All external URLs live in environment files. Services import from `environment.ts` directly. Do NOT hardcode URLs in service files.

- `geminiApiUrl` - Gemini API endpoint (`gemini-flash-latest:generateContent`)
- `githubApiUrl`, `githubRepoOwner`, `githubRepoName` - GitHub session storage

Current GitHub target repo (from `environment.ts` and `environment.prod.ts`): `anhkhoa2001/blog-store`

Environment file replacement on production builds is configured in `angular.json`.

## GitHub Integration

- Sessions save to `{githubApiUrl}/{owner}/{repo}/contents/sessions/` via GitHub Contents API
- Repo must exist before first save
- Requires GitHub PAT with `repo` scope; stored in `localStorage` via `StorageService`
- Non-blocking UX: save failures show status but don't block translation flow

## Data Models

```typescript
Sentence {
  id, original, translation,
  feedback: Feedback[],
  keywords: string[],
  status: 'pending' | 'translated',
  score?: number
}

Feedback { type: 'good' | 'error', message: string }

EvaluationResult { feedback: Feedback[], suggestion: string, score: number }

ArticleSession {
  title, originalText, sentences: Sentence[],
  createdAt, totalSentences, translatedCount,
  completed, averageScore
}

SessionSummary {
  name, path, sha, title, createdAt,
  totalSentences, translatedCount, completed, averageScore
}
```

## Common Patterns

- Components use `@Input()`/`@Output()` with signals in parent (`PracticeContainerComponent`, `ReaderComponent`)
- Services are `@Injectable({ providedIn: 'root' })` and stateless
- Use `signal()` and `computed()` for reactive state in components
- `@HostListener('window:keydown')` for keyboard shortcuts (↑↓ navigation in `ReaderComponent`)

## Known Build Notes

- `reader.component.css` is ~4.6kb raw, exceeding the `anyComponentStyle` budget warning (2kb). This is expected and acceptable for this project.
- `ng build` defaults to **production** configuration (Angular 17+ behavior).
- Strict TypeScript is enabled (`strict: true`, `noImplicitReturns: true`, etc.).

## Build Output

```
dist/ai-translate/   # Production build artifacts
```