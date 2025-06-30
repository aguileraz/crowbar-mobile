# Gemini Guidelines

## 🔄 Project Awareness & Context

- **Always read `ai-docs/planning/PROJECT_PLAN.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `ai-docs/tasks/TASKS.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date and time.
- **For any step completed, make a git commit/push**.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `ai-docs/planning/PROJECT_PLAN.md`.

## 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).

## 🧪 Testing & Reliability

- **Always create unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

## ✅ Task Completion

- **Always update tasks in `ai-docs/tasks/TASKS.md`** with smaller chunks to avoid JSON parsing issues.
- **Always update tasks in `ai-docs/tasks/TASKS.md`** using best practices for markdown and linting.
- **Mark completed tasks in `ai-docs/tasks/TASKS.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `ai-docs/tasks/BACKLOG.md` under a "Discovered During Work" section.

## 📚 Documentation & Explainability

- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When dealing with **API and routes** always update the `ai-docs/api/API.md` using best practices for markdown and linting.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

## 🧠 AI Behavior Rules

- **Always create or update files with smaller chunks to avoid JSON parsing issues**
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Laravel packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `ai-docs/tasks/TASKS.md`.
