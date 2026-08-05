---
name: propose-artwork
description: Expertise in proposing new artworks. Use when the user asks to propose an artwork, add an artwork to the proposed catalogue, or verify an artwork for future addition.
---

# Propose Artwork Skill Instructions

## 🌍 GLOBAL RULE: INTERNATIONALIZATION
Everything must use the international or original name of the entity (artist, artwork, movement). This applies strictly to:
- The `existing_catalogue.md` and `proposed_catalogue.md` documents.
- Generating the `slug` fields in the database (e.g., 'leonardo-da-vinci' instead of 'leonard-de-vinci').
- Searching for images on Wikimedia Commons to ensure accurate matches.

---

When the user asks you to propose a new artwork, artist or movement, you must follow these steps strictly:

1. **Verify Uniqueness**: 
   - Check `/doc/01_product/existing_catalogue.md` to ensure it's not already in the database.
   - Check `/doc/01_product/proposed_catalogue.md` to ensure it hasn't already been proposed.
   If it is present in either file, inform the user and stop.

2. **Verify Wikipedia Image Availability**:
   Before proposing, you MUST ensure there is a usable image on Wikimedia Commons.
   You must run a quick temporary script (Python or Node) to query the Wikimedia API.
   *Example API URL*: `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={Query}&srnamespace=6&format=json`
   *Query*: Try `"{Artist Name} {Artwork Title}"`. If no results, try just `"{Artwork Title}"`.
   
   If an image is found, extract its title (e.g., `File:MyImage.jpg`) and assign the tag with the link: `[[🖼️ Wiki]](https://commons.wikimedia.org/wiki/File:...)`
   If not, assign the tag: `[❌ Pas d'image Wiki]`

3. **Format and Append**:
   Add the artwork to `/doc/01_product/proposed_catalogue.md` under the correct artistic movement (create the movement section if it doesn't exist).
   
   - **If the artist is NOT yet in the proposed catalogue under that movement**, add a new line:
     `*   **Artist Name** : *Artwork Name* [Tag]`
   - **If the artist is ALREADY in the proposed catalogue under that movement**, append the artwork to their existing line:
     `*   **Artist Name** : *Artwork 1* [Tag], *Artwork Name* [Tag]`

4. **Strict Constraint**: 
   Do NOT modify the actual database or run any Prisma scripts. This skill is strictly for enriching the markdown documentation (`proposed_catalogue.md`).
