const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Pop Art
*   **Jasper Johns** : *Flag*
*   **Claes Oldenburg** : *Spoonbridge and Cherry*

## Haute Renaissance
*   **Michel-Ange** : *Le Jugement dernier*

## (Updates to existing sections)
### Antiquité & Art classique
*   **Anonyme (Grèce antique)** : *La Victoire de Samothrace*, *La Vénus de Milo*
*   **Anonyme (Égypte antique)** : *Le Buste de Néfertiti*

### Baroque
*   **Caravaggio** : *L'Appel de saint Matthieu*
*   **Peter Paul Rubens** : *Le Massacre des Innocents*
*   **Gian Lorenzo Bernini** : *L'Extase de sainte Thérèse*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

// Replace these items
proposedContent = proposedContent.replace('*   **Jasper Johns** : *Flag*\n', '');
proposedContent = proposedContent.replace('*   **Claes Oldenburg** : *Spoonbridge and Cherry*\n', '');
proposedContent = proposedContent.replace('*   **Anonyme (Grèce antique)** : *La Victoire de Samothrace* [❌ Pas d\'image Wiki], *La Vénus de Milo* [❌ Pas d\'image Wiki]\n', '');
proposedContent = proposedContent.replace('*   **Anonyme (Égypte antique)** : *Le Buste de Néfertiti* [❌ Pas d\'image Wiki]\n', '');
proposedContent = proposedContent.replace('*   **Caravaggio** : *L\'Appel de saint Matthieu* [❌ Pas d\'image Wiki]\n', '');
proposedContent = proposedContent.replace('*   **Peter Paul Rubens** : *Le Massacre des Innocents* [❌ Pas d\'image Wiki]\n', '');
proposedContent = proposedContent.replace('*   **Gian Lorenzo Bernini** : *L\'Extase de sainte Thérèse* [❌ Pas d\'image Wiki]\n', '');
proposedContent = proposedContent.replace('*   **Michel-Ange** : *Le Jugement dernier* [❌ Pas d\'image Wiki]\n', '');

// Also remove from the "Mise à jour" sections if they are there
proposedContent = proposedContent.replace('*   **Anonymous (Ancient Greece)** : *La Victoire de Samothrace* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Anonymous (Ancient Greece)** : *La Vénus de Milo* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Anonymous (Ancient Egypt)** : *Le Buste de Néfertiti* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Gian Lorenzo Bernini** : *L\'Extase de sainte Thérèse* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Caravaggio** : *L\'Appel de saint Matthieu* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Peter Paul Rubens** : *Le Massacre des Innocents* [❌ Image manquante ou format non supporté]\n', '');
proposedContent = proposedContent.replace('*   **Michel-Ange** : *Le Jugement dernier* [❌ Image manquante ou format non supporté]\n', '');


fs.writeFileSync(proposedCatPath, proposedContent);
console.log('Done moving batch 2 items.');
