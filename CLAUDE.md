<!-- spellchecker: language en_US -->
# TimerShift - Claude Context

## Project Overview

TimerShift is a Tauri desktop application that enables users to run multiple timers simultaneously and transfer time between them. It's designed for tracking time across different tasks and legal cases, with features for categorization, drag-and-drop reordering, and comprehensive history management.

**Key Features:**

- Multiple concurrent timers (tasks and cases)
- Time transfer between timers
- Drag-and-drop timer reordering
- History panel with undo functionality
- macOS menu bar integration
- Dark/light theme support
- Persistent state (localStorage + file system backups)
- Case categories: Injury, Property, General, Workers' Compensation

## Tech Stack

**Frontend:**

- **Preact 10.16.0** (aliased as React 19.2.3 for library compatibility)
- **TypeScript 5.0.2** (strict mode enabled)
- **Tailwind CSS 3.4.17** (utility-first styling)
- **Vite 5.0.0** (build tool)
- **@dnd-kit** (drag-and-drop functionality)
- **lucide-preact** (icons)

**Backend:**

- **Tauri 2.0** (Rust-based desktop framework)
- **tauri-plugin-fs** (file system access)

**Package Management:**

- **Yarn 4.9.2** with Plug'n'Play (PnP) enabled

**Testing:**

- **Vitest 4.0.16** with happy-dom (unit tests)
- **Playwright 1.50.0** (end-to-end tests)
- **@testing-library/preact 3.2.4** (component testing utilities)

## Project Structure

```txt
/
├── src/                      # Frontend source code
│   ├── components/          # Preact components
│   ├── hooks/              # Custom hooks (core state management)
│   ├── utils/              # Utility functions
│   ├── types.ts            # TypeScript type definitions
│   ├── constants.ts        # Application constants
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── src-tauri/              # Rust backend
│   ├── src/main.rs         # Tauri commands & tray integration
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Production config
│   └── tauri.dev.conf.json # Development config
├── tests/e2e/              # Playwright tests
├── public/                 # Static assets (icons)
└── .yarn/                  # Yarn PnP files
```

### Key Files

- [`src/hooks/useTimers.ts`](src/hooks/useTimers.ts) - **Core state management** (single source of truth)
- [`src/types.ts`](src/types.ts) - TypeScript type definitions (`Timer`, `TimerType`, `CaseCategory`)
- [`src/constants.ts`](src/constants.ts) - Application constants (`MAX_LABEL_LENGTH: 30`, `MAX_NOTE_LENGTH: 1000`)
- [`src/App.tsx`](src/App.tsx) - Main application component
- [`src/components/TimerCard.tsx`](src/components/TimerCard.tsx) - Individual timer display
- [`src/utils/theme.ts`](src/utils/theme.ts) - Theme management (light/dark)
- [`src/utils/dndKitPreact.ts`](src/utils/dndKitPreact.ts) - Custom drag-and-drop Preact wrapper
- [`src-tauri/src/main.rs`](src-tauri/src/main.rs) - Tray integration commands

## Code Conventions & Patterns

### TypeScript

- **Strict mode enabled** - no implicit any, unused locals/parameters not allowed
- **Explicit types preferred** - especially for function returns and props
- **Type imports** - use `import type { JSX } from 'preact'`
- All types defined in [`src/types.ts`](src/types.ts)

### Naming Conventions

- **Components**: PascalCase (e.g., `TimerCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTimers.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Timer`, `TimerType`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LABEL_LENGTH`)
- **Utility files**: kebab-case (e.g., `dnd-kit-preact.ts`)

### Component Patterns

```typescript
import type { JSX } from 'preact'
import { useState, useEffect } from 'preact/hooks'

interface MyComponentProps {
  title: string
  onAction: (id: string) => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>('')
  
  const handleClick: JSX.MouseEventHandler<HTMLButtonElement> = (e) => {
    // Event handler logic
  }
  
  return <div>{title}</div>
}
```

### ESLint Rules

- **No semicolons** - ESLint enforces `semi: ["error", "never"]`
- **Import ordering** - enforced by eslint-plugin-import
- **Tailwind class ordering** - enforced by eslint-plugin-tailwindcss
- Match existing patterns when editing files

### Styling

- **Tailwind utilities preferred** - avoid custom CSS where possible
- **CSS custom properties** for theming - defined in [`src/index.css`](src/index.css)
- **Theme system** - managed by [`src/utils/theme.ts`](src/utils/theme.ts)
- Design tokens: `--background`, `--foreground`, `--muted`, `--accent`, etc.

## State Management Pattern

**Single Source of Truth**: The [`useTimers`](src/hooks/useTimers.ts) hook (680 lines) manages all timer state.

**State Persistence**:

1. **localStorage** - primary persistence layer
2. **Tauri file system** - backup logs and exports via [`src/utils/history.ts`](src/utils/history.ts)
3. **Tray updates** - synced via Tauri commands (`set_tray_title`, `set_tray_icon_state`)

**Timer Operations** (all through `useTimers`):

- `addTimer(label, type, category?)` - Create new timer
- `removeTimer(id)` - Remove timer (adds to history)
- `toggleTimer(id)` - Play/pause timer
- `resetTimer(id)` - Reset to zero
- `adjustTime(id, minutes)` - Add/subtract time
- `transferTime(fromId, toId, minutes)` - Move time between timers
- `renameTimer(id, label)` - Update label
- `setNote(id, note)` - Update note
- `reorderTimers(timers)` - Update order after drag-drop

**State Structure**:

```typescript
interface Timer {
  id: string              // UUID
  label: string          // Max 30 chars (MAX_LABEL_LENGTH)
  type: TimerType        // "task" | "case"
  category?: CaseCategory // Injury | Property | General | WC (case only)
  elapsedTime: number    // Seconds
  isRunning: boolean
  note?: string         // Max 1000 chars (MAX_NOTE_LENGTH)
  order: number
}
```

**No external state library** - custom hook pattern is sufficient for this application's needs.

## Architecture Highlights

### Preact/React Aliasing

- Preact is aliased as React in [`vite.config.ts`](vite.config.ts) for library compatibility
- Import from `preact` and `preact/hooks`, not `react`
- JSX types from Preact: `import type { JSX } from 'preact'`

### Drag-and-Drop

- Custom Preact wrapper in [`src/utils/dndKitPreact.ts`](src/utils/dndKitPreact.ts)
- Wraps @dnd-kit components for Preact compatibility
- Used in [`App.tsx`](src/App.tsx) for timer reordering

### macOS Tray Integration

- Rust commands in [`src-tauri/src/main.rs`](src-tauri/src/main.rs)
- `set_tray_title(title: String)` - Updates menu bar display
- `set_tray_icon_state(is_running: bool)` - Changes icon (play/pause)
- Tray click handler shows/focuses window
- macOS-specific features gated with `#[cfg(target_os = "macos")]`

### Timer Categories

- **Tasks**: Simple timers without categories
- **Cases**: Legal case timers with categories:
  - Injury (IN)
  - Property (PR)
  - General (GN)
  - Workers' Compensation (WC)

## Common Development Tasks

### Running the Application

```bash
yarn dev           # Vite dev server only (port 1420)
yarn tauri:dev     # Full Tauri app with hot reload (recommended)
```

### Testing

```bash
yarn test          # Unit tests in watch mode
yarn test:run      # Unit tests (single run)
yarn test:cov      # Unit tests with coverage
yarn test:e2e      # End-to-end tests with Playwright
```

### Building

```bash
yarn build         # TypeScript check + Vite build
yarn bundle        # Full Tauri production bundle (.dmg/.app)
```

### Code Quality

```bash
yarn lint          # TypeScript + ESLint checks
yarn lhci          # Lighthouse CI performance audit
```

## Testing Guidelines

### Unit Tests

- **Framework**: Vitest with happy-dom environment
- **Location**: Test files alongside source (e.g., `TimerCard.test.tsx`)
- **Setup**: [`src/test/setup.ts`](src/test/setup.ts) provides mocks and cleanup
- **Pattern**: Import from `@testing-library/preact`, use `render`, `screen`, `fireEvent`

**Test Setup Provides**:

- Mocked @dnd-kit modules (not compatible with happy-dom)
- localStorage polyfill
- Automatic cleanup after each test

### E2E Tests

- **Framework**: Playwright
- **Location**: [`tests/e2e/`](tests/e2e/)
- **Base URL**: `http://localhost:1420`
- **Auto-starts**: Dev server via Playwright config
- **Example**: [`tests/e2e/timer-card.spec.ts`](tests/e2e/timer-card.spec.ts)

### Coverage

- Provider: @vitest/coverage-v8
- Reports: HTML and LCOV formats
- Output: [`coverage/`](coverage/) directory

## Important Gotchas

### Preact/React Considerations

- Import hooks from `preact/hooks`, not `react`
- JSX event types from Preact: `JSX.MouseEventHandler<T>`
- Some React libraries work via aliasing, but test thoroughly
- @dnd-kit requires custom Preact wrapper

### Yarn PnP

- Uses Plug'n'Play (no `node_modules/`)
- Files: `.pnp.cjs`, `.pnp.loader.mjs`
- **VS Code**: Install ZipFS extension for editor support
- **TypeScript SDK**: Use from `.yarn/sdks` (configured in workspace)

### Constants & Limits

- **Label max length**: 30 characters (`MAX_LABEL_LENGTH`)
- **Note max length**: 1000 characters (`MAX_NOTE_LENGTH`)
- Enforce these limits in forms/validation

### macOS Specificity

- Tray features only work on macOS (`#[cfg(target_os = "macos")]`)
- Window size: 450x600px
- Always test tray integration on macOS

### Tauri Configuration

- **Dev config**: [`src-tauri/tauri.dev.conf.json`](src-tauri/tauri.dev.conf.json)
- **Prod config**: [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json)
- Port 1420 for dev server (configured in Vite)

## File Editing Guidelines

When modifying code:

1. **Read before editing** - Always read files before making changes
2. **Follow patterns** - Match existing code style and structure
3. **No semicolons** - ESLint will fail if you add them
4. **Minimal comments** - Only add comments for non-obvious "why", not "what"
5. **Prefer edits over new files** - Reuse and extend existing code
6. **Type everything** - TypeScript strict mode requires explicit types
7. **Test changes** - Run relevant tests before considering work complete
8. **Check the hook** - Most timer logic belongs in [`useTimers`](src/hooks/useTimers.ts)

## Development Environment

### Recommended VS Code Extensions

- Tauri (`tauri-apps.tauri-vscode`)
- rust-analyzer (`rust-lang.rust-analyzer`)
- ESLint
- Tailwind CSS IntelliSense
- ZipFS (for Yarn PnP support)

### IDE Configuration

- TypeScript SDK path: `.yarn/sdks`
- ESLint: Flat config enabled (`eslint.config.cjs`)
- Formatter: Follow ESLint rules (no semicolons, etc.)

## Quick Reference

**Timer State Hook**: [`src/hooks/useTimers.ts`](src/hooks/useTimers.ts)
**Type Definitions**: [`src/types.ts`](src/types.ts)
**Constants**: [`src/constants.ts`](src/constants.ts)
**Main App**: [`src/App.tsx`](src/App.tsx)
**Tray Integration**: [`src-tauri/src/main.rs`](src-tauri/src/main.rs)
**Theme System**: [`src/utils/theme.ts`](src/utils/theme.ts)

For more details on any component or utility, read the source files directly - they are well-structured and TypeScript types provide inline documentation.
