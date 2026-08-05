---
name: add-artwork
description: Expertise in adding new artworks to the database seed. Use when the user asks to add an artwork, a painting, or an artist to the catalogue.
---

# Add Artwork Skill Instructions

Everything revolves around the **international (original/universal) name** of entities (Movement, Artist, Artwork).

---

## 🔑 Core Rule: International Naming & Slugs
- All entity identifiers and database `slug` values must be generated strictly from their **international name**.
- Image searches start with the international name, falling back to French or native language titles if needed.

---

## 📋 Execution Workflow

When adding an artwork, follow these steps strictly:

### 1. Verification
- Check `/doc/01_product/existing_catalogue.md` to confirm the artwork is not already present. If it exists, inform the user and stop.

### 2. Image Fetching & Visual Verification
- **Provided Image**: If the user provides an image URL, skip the search and proceed directly to visual verification.
- **Wikidata Search**: If no image is provided, query Wikidata for the entity (Artwork) using its name and artist to extract the official image via the **P18** property (which provides the exact Wikimedia Commons file).
- **Fallback for Modern/Copyrighted Art**: If P18 is missing (common for modern art post-1920s), do **NOT** blindly pick the first Wikimedia Commons result, as it might be a diagram, narrative analysis, or parody. Instead, search the English Wikipedia page for the artwork and extract the Fair Use image URL (e.g. `https://en.wikipedia.org/wiki/Special:FilePath/FileName.jpg`).
- Download the candidate image temporarily to the scratch directory (`<appDataDir>/brain/<conversation-id>/scratch/`).
- Use the `view_file` tool to visually inspect the image to ensure it accurately represents the *entire* painting, not a diagram, crop, or detail.
- Obtain full and thumbnail image URLs upon confirmation.

### 3. Database Insertion
Execute a temporary Node/Prisma script to insert the required records:

1. **Movement**: If it does not exist:
   - Insert into `movements` (slug derived from international name).
   - Insert into `movement_translations` for `fr` (French) and `en` (English).
2. **Artist**: If they do not exist:
   - Insert into `artists` (slug derived from international name).
   - Insert into `artist_translations` for `fr` (French) and `en` (English).
3. **Artwork**:
   - Insert into `artworks` (slug derived from international name, verified image URLs, relations to movement and artist).
   - **Crucial**: Set `image_verified: true` in the DB insertion, as you have visually verified the image yourself in Step 2.
   - Insert into `artwork_translations` for `fr` (French title) and `en` (English title).
   - **Constraint**: Leave editorial fields (`introduction`, `main_article`, `short_description`) empty, as AI editorial generation populates article contents separately.

### 4. Catalogue Documentation Update
- Append the new artwork to `/doc/01_product/existing_catalogue.md` under its movement.
- Remove the artwork from `/doc/01_product/proposed_catalogue.md` if it was listed there.
- **IMPORTANT**: Always append the new entity records to their respective JSON reference files (`reference_movements.json`, `reference_artists.json`, `reference_artworks.json`) to keep them in sync as the source of truth for database seeding.
- **Image Validation**: When appending the new artwork to `reference_artworks.json`, explicitly add the field `"image_verified": true` to indicate that you have visually verified the image.

