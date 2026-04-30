# AI Translation Practice - Agent Instructions

## Project Overview
Angular 17 standalone components app for practicing English-to-Vietnamese translation with Gemini AI feedback.

## Key Commands

```bash
npm start              # Dev server at http://localhost:4200
npm run build         # Production build to dist/
npm run build --configuration=production  # Uses environment.prod.ts
ng test              # Karma unit tests
```

## Architecture

- **Angular 17 standalone components** with Signals for state management
- **Location**: `src/app/` with subdirectories: `models/`, `services/`, `components/`
- **Environment configs**: `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod)
- **File replacement on prod build**: configured in `angular.json` to swap env files

## Configuration

All external URLs live in environment files:
- `geminiApiUrl` - Gemini API endpoint
- `githubApiUrl`, `githubRepoOwner`, `githubRepoName` - GitHub session storage

Services read from `environment.ts` via import. Do NOT hardcode URLs in service files.

## GitHub Integration

- Sessions save to `https://github.com/{owner}/{repo}/contents/sessions/` via GitHub Contents API
- Repo must exist before first save (currently: `khoadaubk/ai-translate-sessions`)
- Requires GitHub PAT with `repo` scope
- Non-blocking UX: save failures show status but don't block translation flow

## Data Models

```typescript
Sentence { id, original, translation, feedback: Feedback[], keywords: string[] }
Feedback { type: 'good' | 'error', message: string }
```

## Common Patterns

- Components use `@Input()`/`@Output()` with signals in parent (`ReaderComponent`)
- Services are `@Injectable({ providedIn: 'root' })` and stateless
- Use `signal()` and `computed()` for reactive state in components
- `@HostListener` for keyboard shortcuts (↑↓ navigation in ReaderComponent)

## Known Budget Warnings

`reader.component.css` exceeds 2kb component style budget (2.85kb). This is a warning, not an error. Acceptable for this project.

## Build Output

```
dist/ai-translate/   # Production build artifacts
```
