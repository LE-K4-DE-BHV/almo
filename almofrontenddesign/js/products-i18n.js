// Uebersetzungen der Produkttexte (Deutsch steht als Basis in products.js)
const CATEGORY_TRANSLATIONS = {
  "Ringe": { en: "Rings", fr: "Bagues" },
  "Halsketten": { en: "Necklaces", fr: "Colliers" },
  "Ohrringe": { en: "Earrings", fr: "Boucles d'oreilles" },
  "Armbaender": { en: "Bracelets", fr: "Bracelets" }
};

const PRODUCT_TRANSLATIONS = {
  "ring-aurelia": {
    en: { description: "Simple gold-tone ring with a faceted cubic zirconia stone. Fashion jewelry with a high-quality look.", details: ["Material: alloy, gold-plated", "Stone: cubic zirconia", "Available sizes: 50-62", "Nickel-free"] },
    fr: { description: "Bague simple doree ornee d'une pierre de zircone cubique facettee. Bijou fantaisie a l'allure haut de gamme.", details: ["Matiere : alliage, plaque or", "Pierre : zircone cubique", "Tailles disponibles : 50-62", "Sans nickel"] }
  },
  "ring-luna": {
    en: { description: "Minimalist silver-tone ring, perfect for stacking or wearing alone.", details: ["Material: alloy, rhodium-plated", "Available sizes: 48-64", "Nickel-free"] },
    fr: { description: "Bague minimaliste argentee, parfaite a superposer ou a porter seule.", details: ["Matiere : alliage, rhodie", "Tailles disponibles : 48-64", "Sans nickel"] }
  },
  "ring-topaz": {
    en: { description: "Colorful statement ring with a colored glass stone.", details: ["Material: alloy, gold-plated", "Stone: glass stone", "Available sizes: 50-60"] },
    fr: { description: "Bague statement coloree ornee d'une pierre en verre.", details: ["Matiere : alliage, plaque or", "Pierre : verre colore", "Tailles disponibles : 50-60"] }
  },
  "ring-vivid": {
    en: { description: "Delicate ring with a small, clear-cut stone for everyday wear.", details: ["Material: alloy, rhodium-plated", "Stone: crystal glass", "Available sizes: 48-60"] },
    fr: { description: "Bague delicate ornee d'une petite pierre taillee, ideale au quotidien.", details: ["Matiere : alliage, rhodie", "Pierre : verre cristal", "Tailles disponibles : 48-60"] }
  },
  "ring-mona": {
    en: { description: "Wide band ring in rose gold tone with a textured surface.", details: ["Material: alloy, rose gold-plated", "Available sizes: 50-62", "Width: 6 mm"] },
    fr: { description: "Bague large en finition or rose a la surface texturee.", details: ["Matiere : alliage, plaque or rose", "Tailles disponibles : 50-62", "Largeur : 6 mm"] }
  },
  "ring-elin": {
    en: { description: "Two-tone ring, easy to combine with other rings from the series.", details: ["Material: alloy, two-tone", "Available sizes: 50-60", "Nickel-free"] },
    fr: { description: "Bague bicolore, facile a associer avec d'autres bagues de la collection.", details: ["Matiere : alliage, bicolore", "Tailles disponibles : 50-60", "Sans nickel"] }
  },
  "necklace-stella": {
    en: { description: "Delicate gold-tone chain with a star pendant, adjustable length from 40 to 45 cm.", details: ["Material: alloy, gold-plated", "Length: 40-45 cm adjustable", "Clasp: lobster clasp"] },
    fr: { description: "Chaine doree delicate avec pendentif etoile, longueur reglable de 40 a 45 cm.", details: ["Matiere : alliage, plaque or", "Longueur : 40-45 cm reglable", "Fermoir : mousqueton"] }
  },
  "necklace-perle": {
    en: { description: "Faux pearl on a fine silver-tone chain, timelessly elegant for any occasion.", details: ["Material: alloy, rhodium-plated", "Pearl: faux pearl", "Length: 42 cm"] },
    fr: { description: "Perle fantaisie sur une fine chaine argentee, elegance intemporelle pour toute occasion.", details: ["Matiere : alliage, rhodie", "Perle : perle fantaisie", "Longueur : 42 cm"] }
  },
  "necklace-choker": {
    en: { description: "Close-fitting choker-style chain, versatile to combine.", details: ["Material: alloy", "Length: 35-38 cm adjustable", "Clasp: lobster clasp"] },
    fr: { description: "Chaine ras-de-cou style choker, facile a associer.", details: ["Matiere : alliage", "Longueur : 35-38 cm reglable", "Fermoir : mousqueton"] }
  },
  "necklace-aria": {
    en: { description: "Multi-strand chain with fine links, a great eye-catcher for simple outfits.", details: ["Material: alloy, gold-plated", "Length: 38-44 cm adjustable", "Clasp: lobster clasp"] },
    fr: { description: "Chaine multirang aux mailles fines, parfaite pour sublimer une tenue simple.", details: ["Matiere : alliage, plaque or", "Longueur : 38-44 cm reglable", "Fermoir : mousqueton"] }
  },
  "necklace-luz": {
    en: { description: "Chain with a small coin pendant, understated and perfect for everyday wear.", details: ["Material: alloy, gold-plated", "Length: 40 cm", "Clasp: spring ring"] },
    fr: { description: "Chaine avec petit pendentif piece, discrete et parfaite au quotidien.", details: ["Matiere : alliage, plaque or", "Longueur : 40 cm", "Fermoir : anneau ressort"] }
  },
  "necklace-coco": {
    en: { description: "Bold curb chain in gold tone, an on-trend look.", details: ["Material: alloy, gold-plated", "Length: 45 cm", "Clasp: lobster clasp"] },
    fr: { description: "Chaine gourmette imposante en finition or, look tendance du moment.", details: ["Matiere : alliage, plaque or", "Longueur : 45 cm", "Fermoir : mousqueton"] }
  },
  "earrings-vera": {
    en: { description: "Small hoop earrings in gold tone, lightweight and perfect for everyday wear.", details: ["Material: alloy, gold-plated", "Diameter: 18 mm", "Clasp: hinged snap"] },
    fr: { description: "Petites creoles dorees, legeres et ideales au quotidien.", details: ["Matiere : alliage, plaque or", "Diametre : 18 mm", "Fermoir : charniere clipsee"] }
  },
  "earrings-nova": {
    en: { description: "Sparkling stud earrings with cubic zirconia, perfect for special occasions.", details: ["Material: alloy, rhodium-plated", "Stone: cubic zirconia", "Clasp: stud with safety back"] },
    fr: { description: "Puces d'oreilles scintillantes en zircone cubique, ideales pour les grandes occasions.", details: ["Matiere : alliage, rhodie", "Pierre : zircone cubique", "Fermoir : puce avec systeme de securite"] }
  },
  "earrings-hoops": {
    en: { description: "Larger gold-tone hoop earrings in boho style.", details: ["Material: alloy, gold-plated", "Diameter: 35 mm", "Weight: lightweight"] },
    fr: { description: "Grandes creoles dorees au style boheme.", details: ["Matiere : alliage, plaque or", "Diametre : 35 mm", "Poids : leger"] }
  },
  "earrings-luna": {
    en: { description: "Small moon stud earrings in silver tone.", details: ["Material: alloy, rhodium-plated", "Size: 10 mm", "Clasp: stud"] },
    fr: { description: "Petites puces en forme de lune, finition argentee.", details: ["Matiere : alliage, rhodie", "Taille : 10 mm", "Fermoir : puce"] }
  },
  "earrings-pearl": {
    en: { description: "Classic stud earrings with a faux pearl, suitable for any occasion.", details: ["Material: alloy, gold-plated", "Pearl: faux pearl 8 mm", "Clasp: stud"] },
    fr: { description: "Puces classiques ornees d'une perle fantaisie, adaptees a toute occasion.", details: ["Matiere : alliage, plaque or", "Perle : perle fantaisie 8 mm", "Fermoir : puce"] }
  },
  "earrings-drop": {
    en: { description: "Delicate drop earrings, lightweight with a subtle shine.", details: ["Material: alloy, gold-plated", "Length: 25 mm", "Clasp: hinged snap"] },
    fr: { description: "Boucles d'oreilles pendantes delicates, legeres avec un eclat subtil.", details: ["Matiere : alliage, plaque or", "Longueur : 25 mm", "Fermoir : charniere clipsee"] }
  },
  "bracelet-mira": {
    en: { description: "Delicate chain bracelet with a small heart charm.", details: ["Material: alloy, gold-plated", "Length: 16-19 cm adjustable", "Clasp: spring ring"] },
    fr: { description: "Bracelet chaine delicat avec petit pendentif coeur.", details: ["Matiere : alliage, plaque or", "Longueur : 16-19 cm reglable", "Fermoir : anneau ressort"] }
  },
  "bracelet-onda": {
    en: { description: "Wavy bracelet with a matte finish, a modern statement piece.", details: ["Material: alloy, matte finish", "Length: 17-20 cm adjustable", "Clasp: lobster clasp"] },
    fr: { description: "Bracelet ondule a la finition mate, une piece statement moderne.", details: ["Matiere : alliage, finition mate", "Longueur : 17-20 cm reglable", "Fermoir : mousqueton"] }
  },
  "bracelet-charm": {
    en: { description: "Bracelet with several small charms in boho style.", details: ["Material: alloy", "Length: 18-22 cm adjustable", "Clasp: spring ring"] },
    fr: { description: "Bracelet orne de plusieurs petites breloques au style boheme.", details: ["Matiere : alliage", "Longueur : 18-22 cm reglable", "Fermoir : anneau ressort"] }
  },
  "bracelet-linka": {
    en: { description: "Slim chain bracelet, easy to stack with other bracelets.", details: ["Material: alloy, gold-plated", "Length: 15-18 cm adjustable", "Clasp: spring ring"] },
    fr: { description: "Bracelet chaine fin, facile a superposer avec d'autres bracelets.", details: ["Matiere : alliage, plaque or", "Longueur : 15-18 cm reglable", "Fermoir : anneau ressort"] }
  },
  "bracelet-perle": {
    en: { description: "Bracelet with small faux pearls on a thin chain.", details: ["Material: alloy, rhodium-plated", "Pearls: faux pearls 4 mm", "Length: 17-19 cm adjustable"] },
    fr: { description: "Bracelet orne de petites perles fantaisie sur une fine chaine.", details: ["Matiere : alliage, rhodie", "Perles : perles fantaisie 4 mm", "Longueur : 17-19 cm reglable"] }
  },
  "bracelet-vibe": {
    en: { description: "Wide statement bracelet with a textured surface.", details: ["Material: alloy, gold-plated", "Length: 18-21 cm adjustable", "Clasp: lobster clasp"] },
    fr: { description: "Bracelet statement large a la surface texturee.", details: ["Matiere : alliage, plaque or", "Longueur : 18-21 cm reglable", "Fermoir : mousqueton"] }
  }
};
