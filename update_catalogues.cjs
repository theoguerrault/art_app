const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Sculpture Moderne
*   **Auguste Rodin** : *Le Penseur*, *Le Baiser*, *Les Bourgeois de Calais*
*   **Louise Bourgeois** : *Maman*

## Art Déco
*   **Tamara de Lempicka** : *Autoportrait dans la Bugatti verte*

## Suprématisme
*   **Kazimir Malevitch** : *Carré noir sur fond blanc*

## Modernisme Américain
*   **Georgia O'Keeffe** : *Jimson Weed/White Flower No. 1*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

// We just do simple string replacements to remove them.
proposedContent = proposedContent.replace('*   **Auguste Rodin** : *Le Penseur*, *Le Baiser*, *Les Bourgeois de Calais*\n', '');
proposedContent = proposedContent.replace('*   **Louise Bourgeois** : *Maman*\n', '');
proposedContent = proposedContent.replace('*   **Kazimir Malevitch** : *Carré noir sur fond blanc* (Suprématisme)\n', '');
proposedContent = proposedContent.replace('*   **Georgia O\'Keeffe** : *Jimson Weed/White Flower No. 1* (Modernisme américain)\n', '');
proposedContent = proposedContent.replace('*   **Tamara de Lempicka** : *Autoportrait dans la Bugatti verte* (Art Déco)\n', '');

fs.writeFileSync(proposedCatPath, proposedContent);
console.log('Done moving items.');
