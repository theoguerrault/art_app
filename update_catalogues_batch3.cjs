const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Impressionnisme
*   **Claude Monet** : *Impression, soleil levant*

## Post-Impressionnisme
*   **Vincent van Gogh** : *Autoportrait à l'oreille bandée*, *Champ de blé aux corbeaux*

## Expressionnisme
*   **Edvard Munch** : *Le Cri*

## Cubisme
*   **Marcel Duchamp** : *Nu descendant un escalier (N°2)*
*   **Pablo Picasso** : *Les Demoiselles d'Avignon*

## Surréalisme
*   **Salvador Dalí** : *La Persistance de la mémoire*
*   **René Magritte** : *Le Fils de l'homme*

## (Updates to existing sections)
### Dutch Golden Age
*   **Rembrandt** : *La Ronde de nuit*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

// The strings to replace:
const toRemove = [
  '*   **Rembrandt** : *Fig. 52 (La Ronde de nuit de Rembrandt)* [❌ Pas d\'image Wiki]\n',
  '*   **Marcel Duchamp** : *Nude Descending a Staircase, No. 2* [❌ Pas d\'image Wiki]\n',
  '*   **Pablo Picasso** : *Guernica* [❌ Pas d\'image Wiki], *Les Demoiselles d\'Avignon* [❌ Pas d\'image Wiki]\n',
  '*   **Salvador Dalí** : *The Persistence of Memory* [❌ Pas d\'image Wiki], *Swans Reflecting Elephants* [❌ Pas d\'image Wiki]\n',
  '*   **René Magritte** : *The Son of Man* [❌ Pas d\'image Wiki], *Golconda* [❌ Pas d\'image Wiki], *The Treachery of Images* [❌ Pas d\'image Wiki]\n',
  '*   **Vincent van Gogh** : *L\'Autoportrait à l\'oreille bandée* [❌ Pas d\'image Wiki], *Le Champ de blé aux corbeaux* [❌ Pas d\'image Wiki]\n',
  '*   **Claude Monet** : *Impression, Sunrise* [❌ Pas d\'image Wiki]\n',
  '*   **Edvard Munch** : *The Scream* [❌ Pas d\'image Wiki]\n'
];

for (const str of toRemove) {
  proposedContent = proposedContent.replace(str, '');
}

fs.writeFileSync(proposedCatPath, proposedContent);
console.log('Done moving batch 3 items.');
