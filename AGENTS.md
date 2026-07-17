# Global Agent Instructions

## Answer instruction
Before any answer : 
- Always call me by my name
- Always be concise
- Always talk in english

## Documentation structure
Project specifications reside inside structured thematic folders in `/doc/`:
- `01_product/`: Product definitions (`core_features.md`), Leitner progression rules (`learning_mechanics.md`), and UX principles (`user_experience.md`).
- `02_system_architecture/`: Frontend tech stack (`frontend_stack.md`) and database schema/security (`database_and_security.md`).
- `03_core_engine/`: Data ingestion (`data_ingestion.md`), AI generation (`ai_mcq_engine.md`), and offline synchronization failover (`offline_synchronization.md`).
- `04_project_management/`: Autonomous agent execution checklist and verification criteria (`mvp_roadmap.md`).

## Evolutive rules 
When I correct you or you learn something new, update the list below :
- Never write test unless explicitly requested
- All AI prompts, system instructions, source code, comments, and project documentation (`/doc/*.md`) must be written strictly in English
- Always respect conventionnal commits