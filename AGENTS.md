## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm

---

# Global Agent Instructions

## Answer instruction
Before any answer: 
- Always call me by my name
- Always be concise
- Always talk in english

## Documentation & Architecture
**Always consult and update the technical specifications in `/doc/` before making architectural decisions:**
- `01_product/`: Product definitions, Leitner rules, UX principles.
- `02_system_architecture/`: Frontend stack (FSD, Svelte 5) & Database schema/security.
- `03_core_engine/`: Data ingestion, AI generation, offline synchronization.
- `04_project_management/`: Autonomous agent execution checklist (`mvp_roadmap.md`).

## Evolutive rules 
When I correct you or you learn something new, update the list below:
- Never write tests unless explicitly requested
- All AI prompts, system instructions, source code, comments, and project documentation (`/doc/*.md`) must be written strictly in English
- Always respect conventional commits
- Whenever modifying schemas, APIs, or architecture, verify and update the corresponding documentation in `/doc/`
- Always consult `/doc/01_product/ui_design_system.md` before making any UI, layout or CSS changes