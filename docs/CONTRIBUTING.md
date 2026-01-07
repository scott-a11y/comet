# 📜 Development & Coding Standards

## 1. Naming Conventions

To maintain a consistent and professional codebase, all contributors must follow these naming conventions:

### 📁 Directories
- **Convention:** `kebab-case`
- **Example:** `wall-designer`, `api-middleware`

### 📄 Files
- **React Components:** `PascalCase.tsx` (e.g., `EnhancedWallEditor.tsx`)
- **Utilities/Logic:** `kebab-case.ts` (e.g., `canvas-utils.ts`)
- **Styles:** `globals.css` (lowercase)

### 💻 Code
- **Variables/Functions:** `camelCase`
- **Classes/Interfaces/Types:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

---

## 2. Directory Responsibilities

### `app/` (The Application Layer)
- Contains routes and page-level logic.
- Keep components in page files minimal; delegate to the `components/` directory.

### `actions/` (The Service Layer)
- Complex server-side logic and database mutations.
- Uses the `zsa` pattern for type-safe server actions.

### `lib/` (The Domain/Business Logic Layer)
- Pure logic, math, and core domain managers.
- No UI code allowed here.

### `components/` (The Presentation Layer)
- Reusable UI elements.
- Organized by feature (e.g., `components/wall-designer`).

---

## 3. Modular Architecture (Barrel Exports)

For major feature modules in `lib/`, use `index.ts` files to expose the public API. This prevents deep nesting imports:

**❌ Avoid:**
`import { SnapManager } from '@/lib/wall-designer/SnapManager';`

**✅ Preferred:**
`import { SnapManager } from '@/lib/wall-designer';`

---

## 4. API Design Guidelines

### Server Actions vs API Routes
- **Server Actions:** Use for all internal application logic (forms, buttons, UI triggers).
- **API Routes:** Use ONLY for external integrations, webhooks, or public-facing data endpoints.

---

## 5. Security & Performance
- Always use **Zod** for input validation in both Actions and APIs.
- Use **Prisma** for all database interactions.
- Keep the `Canvas` performance-optimized by minimizing re-renders in Konva.
