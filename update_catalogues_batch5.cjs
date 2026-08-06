const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Haute Renaissance
*   **Titian** : *Venus of Urbino*

## Renaissance
*   **Albrecht Dürer** : *Autoportrait à la fourrure*

## Néoclassicisme
*   **Jacques-Louis David** : *L'Intervention des Sabines*

## Romantisme
*   **Ilya Repin** : *Les Haleurs de la Volga*

## Réalisme
*   **Gustave Courbet** : *Un enterrement à Ornans*

## (Updates to existing sections)
### Impressionnisme
*   **Edgar Degas** : *L'Absinthe*

### Post-Impressionnisme
*   **Paul Cézanne** : *Les Grandes Baigneuses*
*   **Paul Gauguin** : *D'où venons-nous ? Que sommes-nous ? Où allons-nous ?*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

const toRemove = [
  '*   **Titian** : *Venus of Urbino* [❌ Pas d\'image Wiki]\n',
  '*   **Albrecht Dürer** : *Autoportrait à la fourrure* [❌ Pas d\'image Wiki]\n',
  '*   **Jacques-Louis David** : *The Intervention of the Sabine Women* [❌ Pas d\'image Wiki]\n',
  '*   **Ilya Repin** : *Les Haleurs de la Volga* [❌ Pas d\'image Wiki]\n',
  '*   **Gustave Courbet** : *A Burial at Ornans* [❌ Pas d\'image Wiki]\n',
  '*   **Edgar Degas** : *L\'Absinthe* [❌ Pas d\'image Wiki]\n',
  '*   **Paul Cézanne** : *Bathers (Les Grandes Baigneuses)* [❌ Pas d\'image Wiki]\n',
  '*   **Paul Gauguin** : *Where Do We Come From? What Are We? Where Are We Going?* [❌ Pas d\'image Wiki]\n'
];

for (const str of toRemove) {
  proposedContent = proposedContent.replace(str, '');
}

fs.writeFileSync(proposedCatPath, proposedContent);
console.log('Done moving batch 5 items.');
