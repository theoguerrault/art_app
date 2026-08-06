const fs = require('fs');
const path = require('path');

const existingCatPath = path.join(__dirname, 'doc/01_product/existing_catalogue.md');
const proposedCatPath = path.join(__dirname, 'doc/01_product/proposed_catalogue.md');
const manualCatPath = path.join(__dirname, 'doc/01_product/manual_image_catalogue.md');

// 1. Append to existing_catalogue.md
let existingContent = fs.readFileSync(existingCatPath, 'utf8');

const additions = `
## Peinture métaphysique
*   **Giorgio de Chirico** : *Mystère et mélancolie d'une rue*

## Surréalisme
*   **Max Ernst** : *L'Éléphant Célèbes*
*   **René Magritte** : *L'Empire des lumières*
*   **Yves Tanguy** : *Maman, Papa est blessé !*

## Dadaïsme
*   **Man Ray** : *Le Violon d'Ingres*
*   **Marcel Duchamp** : *L.H.O.O.Q.*

## Fauvisme
*   **Henri Matisse** : *Nu bleu II*

## Expressionnisme
*   **Oskar Kokoschka** : *La Fiancée du vent*

## Pop Art
*   **Richard Hamilton** : *Qu'est-ce qui rend exactement les maisons d'aujourd'hui si différentes, si séduisantes ?*
`;
existingContent += additions;
fs.writeFileSync(existingCatPath, existingContent);

// 2. Remove from proposed_catalogue.md
let proposedContent = fs.readFileSync(proposedCatPath, 'utf8');

// These were verified and moved to existing_catalogue
const toRemoveVerified = [
  '*   **Giorgio de Chirico** : *Mystery and Melancholy of a Street* [❌ Pas d\'image Wiki]\n',
  '*   **Max Ernst** : *The Elephant Celebes* [❌ Pas d\'image Wiki]',
  '*   **René Magritte** : *The Empire of Lights* [❌ Pas d\'image Wiki]',
  '*   **Yves Tanguy** : **Maman](https://commons.wikimedia.org/wiki/File%3AMama%2C_Papa_is_Wounded%21.jpg)* [❌ Pas d\'image Wiki]\n',
  '*   **Man Ray** : *Ingres\'s Violin* [❌ Pas d\'image Wiki]\n',
  '*   **Marcel Duchamp** : *L.H.O.O.Q.* [❌ Pas d\'image Wiki]\n',
  '*   **Henri Matisse** : *Blue Nude II* [❌ Pas d\'image Wiki]\n',
  '*   **Oskar Kokoschka** : *The Bride of the Wind* [❌ Pas d\'image Wiki]\n',
  '*   **Richard Hamilton** : *Just what is it that makes today\'s homes so different, so appealing?*\n'
];

// These were rejected (no image/wrong image)
const toRemoveRejected = [
  '*   **Georges Braque** : *Pitcher and Violin* [❌ Pas d\'image Wiki]',
  '*   **Pablo Picasso** : *Three Musicians* [❌ Pas d\'image Wiki]\n',
  '*   **Marc Chagall** : *Le Chant des voyelles* [❌ Pas d\'image Wiki]', // Wait, Joan Miró was Le Chant des voyelles
  '*   **Joan Miró** : *Le Chant des voyelles* [❌ Pas d\'image Wiki]\n',
  '*   **Wassily Kandinsky** : *Le Cavalier bleu* [❌ Pas d\'image Wiki]\n',
  '*   **André Derain** : *Charing Cross Bridge* [❌ Pas d\'image Wiki]',
  '*   **Maurice de Vlaminck** : *Le Restaurant de la Machine à Bougival* [❌ Pas d\'image Wiki]\n',
  '*   **Georges Rouault** : *The Old King* [❌ Pas d\'image Wiki]\n',
  '*   **Alberto Giacometti** : *L\'Homme qui marche I*\n',
  '*   **Alexander Calder** : *Rouge Triomphant* (Mobile)\n',
  '*   **Robert Rauschenberg** : *Retroactive I*\n',
  '*   **Willem de Kooning** : *Excavation* [❌ Pas d\'image Wiki]\n'
];

for (const str of [...toRemoveVerified, ...toRemoveRejected]) {
  proposedContent = proposedContent.replace(str, '');
}
// Note: sometimes commas are left behind. I'll just do a global replace for now.

fs.writeFileSync(proposedCatPath, proposedContent);

// 3. Create/Append to manual_image_catalogue.md
let manualContent = '';
if (fs.existsSync(manualCatPath)) {
    manualContent = fs.readFileSync(manualCatPath, 'utf8');
} else {
    manualContent = '# Manual Image Catalogue\n\nThese artworks could not be retrieved automatically via Wikipedia API and require manual image addition.\n\n';
}

const rejectedAdditions = `
*   **Georges Braque** : *Pitcher and Violin*
*   **Pablo Picasso** : *Three Musicians*
*   **Joan Miró** : *Le Chant des voyelles*
*   **Wassily Kandinsky** : *Der Blaue Reiter*
*   **André Derain** : *Charing Cross Bridge*
*   **Maurice de Vlaminck** : *Le Restaurant de la Machine à Bougival*
*   **Georges Rouault** : *The Old King*
*   **Alberto Giacometti** : *L'Homme qui marche I*
*   **Alexander Calder** : *Rouge Triomphant*
*   **Robert Rauschenberg** : *Retroactive I*
*   **Willem de Kooning** : *Excavation*
`;

manualContent += rejectedAdditions;
fs.writeFileSync(manualCatPath, manualContent);

console.log('Done updating catalogues batch 6.');
