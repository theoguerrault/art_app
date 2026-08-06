const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Photographie
*   **Ansel Adams** : *Moonrise, Hernandez, New Mexico*
*   **Steve McCurry** : *Afghan Girl*
*   **Sebastião Salgado** : *Serra Pelada Gold Mine*

## (Updates to existing sections)
### Art Global & Art Contemporain
*   **Francis Bacon** : *Three Studies for Figures at the Base of a Crucifixion*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

const toRemove = [
  '*   **Ansel Adams** : *Moonrise, Hernandez, New Mexico* [❌ Pas d\'image Wiki]\n',
  '*   **Steve McCurry** : *Afghan Girl* [❌ Pas d\'image Wiki]\n',
  '*   **Sebastião Salgado** : *Serra Pelada Gold Mine* [❌ Pas d\'image Wiki]\n',
  '*   **Francis Bacon** : *Three Studies for Figures at the Base of a Crucifixion* [❌ Pas d\'image Wiki]\n',
  '*   **Jean-Michel Basquiat** : *Boy and Dog in a Johnnypump* [❌ Pas d\'image Wiki],  *Irony of Negro Policeman* [❌ Pas d\'image Wiki]\n'
];

for (const str of toRemove) {
  proposedContent = proposedContent.replace(str, '');
}

fs.writeFileSync(proposedCatPath, proposedContent);
console.log('Done moving batch 4 items.');
