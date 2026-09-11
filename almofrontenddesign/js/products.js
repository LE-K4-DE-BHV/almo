// Produktkatalog (statische Daten, spaeter durch Backend/API ersetzbar)
const PRODUCTS = [
  {
    id: "ring-aurelia",
    name: "Ring Aurelia",
    category: "Ringe",
    price: 14.9,
    compareAt: 19.9,
    badge: "Bestseller",
    rating: 4.6,
    reviewCount: 128,
    stock: "in_stock",
    description: "Schlichter goldfarbener Ring mit einem facettierten Zirkonia-Stein. Modeschmuck mit hochwertiger Optik.",
    details: ["Material: Legierung, vergoldet", "Stein: Zirkonia", "Verfuegbare Groessen: 50-62", "Nickelfrei"],
    images: [
      "https://images.pexels.com/photos/1616096/pexels-photo-1616096.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8398912/pexels-photo-8398912.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "ring-luna",
    name: "Ring Luna",
    category: "Ringe",
    price: 9.9,
    compareAt: null,
    badge: null,
    rating: 4.3,
    reviewCount: 64,
    stock: "in_stock",
    description: "Minimalistischer silberfarbener Ring, perfekt zum Kombinieren oder als Solitaer.",
    details: ["Material: Legierung, rhodiniert", "Verfuegbare Groessen: 48-64", "Nickelfrei"],
    images: [
      "https://images.pexels.com/photos/8398912/pexels-photo-8398912.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "ring-topaz",
    name: "Ring Topaz",
    category: "Ringe",
    price: 13.9,
    compareAt: null,
    badge: null,
    rating: 4.1,
    reviewCount: 37,
    stock: "in_stock",
    description: "Bunter Statement-Ring mit farbigem Glasstein.",
    details: ["Material: Legierung, vergoldet", "Stein: Glasstein", "Verfuegbare Groessen: 50-60"],
    images: [
      "https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1395306/pexels-photo-1395306.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "ring-vivid",
    name: "Ring Vivid",
    category: "Ringe",
    price: 11.9,
    compareAt: 15.9,
    badge: "Sale",
    rating: 4.4,
    reviewCount: 52,
    stock: "in_stock",
    description: "Zarter Ring mit kleinem, klar geschliffenem Stein fuer den taeglichen Auftritt.",
    details: ["Material: Legierung, rhodiniert", "Stein: Kristallglas", "Verfuegbare Groessen: 48-60"],
    images: [
      "https://images.pexels.com/photos/1395306/pexels-photo-1395306.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3641059/pexels-photo-3641059.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "ring-mona",
    name: "Ring Mona",
    category: "Ringe",
    price: 16.9,
    compareAt: null,
    badge: "Neu",
    rating: 4.7,
    reviewCount: 21,
    stock: "low_stock",
    description: "Breiter Bandring in Roségold-Optik mit strukturierter Oberflaeche.",
    details: ["Material: Legierung, rosevergoldet", "Verfuegbare Groessen: 50-62", "Breite: 6 mm"],
    images: [
      "https://images.pexels.com/photos/3641059/pexels-photo-3641059.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3641056/pexels-photo-3641056.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "ring-elin",
    name: "Ring Elin",
    category: "Ringe",
    price: 10.9,
    compareAt: null,
    badge: null,
    rating: 4.0,
    reviewCount: 18,
    stock: "in_stock",
    description: "Zweifarbiger Ring, kombinierbar mit anderen Ringen aus der Serie.",
    details: ["Material: Legierung, bicolor", "Verfuegbare Groessen: 50-60", "Nickelfrei"],
    images: [
      "https://images.pexels.com/photos/3641056/pexels-photo-3641056.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1616096/pexels-photo-1616096.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-stella",
    name: "Halskette Stella",
    category: "Halsketten",
    price: 17.9,
    compareAt: 24.9,
    badge: "Neu",
    rating: 4.5,
    reviewCount: 96,
    stock: "in_stock",
    description: "Zarte goldfarbene Kette mit Sternanhaenger, verstellbare Laenge von 40 bis 45 cm.",
    details: ["Material: Legierung, vergoldet", "Laenge: 40-45 cm verstellbar", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/7134458/pexels-photo-7134458.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/220684/pexels-photo-220684.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-perle",
    name: "Halskette Perle",
    category: "Halsketten",
    price: 15.9,
    compareAt: null,
    badge: null,
    rating: 4.2,
    reviewCount: 44,
    stock: "in_stock",
    description: "Kunstperle an feiner silberfarbener Kette, zeitlos elegant fuer jeden Anlass.",
    details: ["Material: Legierung, rhodiniert", "Perle: Kunstperle", "Laenge: 42 cm"],
    images: [
      "https://images.pexels.com/photos/220684/pexels-photo-220684.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/10581731/pexels-photo-10581731.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-choker",
    name: "Choker Nera",
    category: "Halsketten",
    price: 6.9,
    compareAt: null,
    badge: null,
    rating: 3.9,
    reviewCount: 29,
    stock: "in_stock",
    description: "Enganliegende Kette im Choker-Stil, vielseitig kombinierbar.",
    details: ["Material: Legierung", "Laenge: 35-38 cm verstellbar", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/10581731/pexels-photo-10581731.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/4532678/pexels-photo-4532678.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-aria",
    name: "Halskette Aria",
    category: "Halsketten",
    price: 19.9,
    compareAt: 26.9,
    badge: "Sale",
    rating: 4.6,
    reviewCount: 71,
    stock: "in_stock",
    description: "Mehrreihige Kette mit feinen Gliedern, ideal als Blickfang zu schlichten Outfits.",
    details: ["Material: Legierung, vergoldet", "Laenge: 38-44 cm verstellbar", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/4532678/pexels-photo-4532678.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/11185100/pexels-photo-11185100.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-luz",
    name: "Halskette Luz",
    category: "Halsketten",
    price: 12.9,
    compareAt: null,
    badge: null,
    rating: 4.1,
    reviewCount: 15,
    stock: "low_stock",
    description: "Kette mit kleinem Muenzanhaenger, dezent und alltagstauglich.",
    details: ["Material: Legierung, vergoldet", "Laenge: 40 cm", "Verschluss: Federring"],
    images: [
      "https://images.pexels.com/photos/11185100/pexels-photo-11185100.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/6467618/pexels-photo-6467618.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "necklace-coco",
    name: "Halskette Coco",
    category: "Halsketten",
    price: 22.9,
    compareAt: null,
    badge: "Neu",
    rating: 4.8,
    reviewCount: 12,
    stock: "in_stock",
    description: "Kraeftige Panzerkette in Gold-Optik, aktueller Trend-Look.",
    details: ["Material: Legierung, vergoldet", "Laenge: 45 cm", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/6467618/pexels-photo-6467618.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/7134458/pexels-photo-7134458.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-vera",
    name: "Ohrringe Vera",
    category: "Ohrringe",
    price: 8.9,
    compareAt: null,
    badge: null,
    rating: 4.3,
    reviewCount: 58,
    stock: "in_stock",
    description: "Kleine Creolen aus goldfarbenem Material, leicht und alltagstauglich.",
    details: ["Material: Legierung, vergoldet", "Durchmesser: 18 mm", "Verschluss: Klappscharnier"],
    images: [
      "https://images.pexels.com/photos/5370641/pexels-photo-5370641.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/12144990/pexels-photo-12144990.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-nova",
    name: "Ohrringe Nova",
    category: "Ohrringe",
    price: 11.9,
    compareAt: 15.9,
    badge: "Sale",
    rating: 4.5,
    reviewCount: 83,
    stock: "in_stock",
    description: "Funkelnde Ohrstecker mit Zirkonia, ideal fuer besondere Anlaesse.",
    details: ["Material: Legierung, rhodiniert", "Stein: Zirkonia", "Verschluss: Ohrstecker mit Sicherheitsverschluss"],
    images: [
      "https://images.pexels.com/photos/12144990/pexels-photo-12144990.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-hoops",
    name: "Creolen Ibiza",
    category: "Ohrringe",
    price: 7.9,
    compareAt: 9.9,
    badge: "Sale",
    rating: 4.2,
    reviewCount: 39,
    stock: "in_stock",
    description: "Groessere goldfarbene Creolen im Boho-Stil.",
    details: ["Material: Legierung, vergoldet", "Durchmesser: 35 mm", "Gewicht: leicht"],
    images: [
      "https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1721937/pexels-photo-1721937.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-luna",
    name: "Ohrringe Luna",
    category: "Ohrringe",
    price: 9.9,
    compareAt: null,
    badge: null,
    rating: 4.0,
    reviewCount: 22,
    stock: "in_stock",
    description: "Kleine Mondstecker aus silberfarbenem Material.",
    details: ["Material: Legierung, rhodiniert", "Groesse: 10 mm", "Verschluss: Ohrstecker"],
    images: [
      "https://images.pexels.com/photos/1721937/pexels-photo-1721937.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/10983783/pexels-photo-10983783.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-pearl",
    name: "Ohrringe Pearl",
    category: "Ohrringe",
    price: 13.9,
    compareAt: null,
    badge: "Neu",
    rating: 4.6,
    reviewCount: 9,
    stock: "low_stock",
    description: "Klassische Ohrstecker mit Kunstperle, passend zu jedem Anlass.",
    details: ["Material: Legierung, vergoldet", "Perle: Kunstperle 8 mm", "Verschluss: Ohrstecker"],
    images: [
      "https://images.pexels.com/photos/10983783/pexels-photo-10983783.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/5370641/pexels-photo-5370641.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "earrings-drop",
    name: "Ohrringe Drop",
    category: "Ohrringe",
    price: 10.9,
    compareAt: null,
    badge: null,
    rating: 4.3,
    reviewCount: 27,
    stock: "in_stock",
    description: "Filigrane Tropfen-Ohrringe, leicht und dezent glaenzend.",
    details: ["Material: Legierung, vergoldet", "Laenge: 25 mm", "Verschluss: Klappscharnier"],
    images: [
      "https://images.pexels.com/photos/12144990/pexels-photo-12144990.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1721937/pexels-photo-1721937.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-mira",
    name: "Armband Mira",
    category: "Armbaender",
    price: 12.9,
    compareAt: null,
    badge: null,
    rating: 4.4,
    reviewCount: 61,
    stock: "in_stock",
    description: "Filigranes Kettenarmband mit kleinem Herzanhaenger.",
    details: ["Material: Legierung, vergoldet", "Laenge: 16-19 cm verstellbar", "Verschluss: Federring"],
    images: [
      "https://images.pexels.com/photos/12194325/pexels-photo-12194325.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/12124662/pexels-photo-12124662.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-onda",
    name: "Armband Onda",
    category: "Armbaender",
    price: 10.9,
    compareAt: null,
    badge: "Neu",
    rating: 4.1,
    reviewCount: 33,
    stock: "in_stock",
    description: "Gewelltes Armband mit mattem Finish, modernes Statement-Piece.",
    details: ["Material: Legierung, matt", "Laenge: 17-20 cm verstellbar", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/12124662/pexels-photo-12124662.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/12495610/pexels-photo-12495610.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-charm",
    name: "Armband Charm",
    category: "Armbaender",
    price: 16.9,
    compareAt: null,
    badge: null,
    rating: 4.5,
    reviewCount: 47,
    stock: "in_stock",
    description: "Armband mit mehreren kleinen Anhaengern im Boho-Stil.",
    details: ["Material: Legierung", "Laenge: 18-22 cm verstellbar", "Verschluss: Federring"],
    images: [
      "https://images.pexels.com/photos/12495610/pexels-photo-12495610.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/16304539/pexels-photo-16304539.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-linka",
    name: "Armband Linka",
    category: "Armbaender",
    price: 9.9,
    compareAt: 13.9,
    badge: "Sale",
    rating: 4.0,
    reviewCount: 19,
    stock: "in_stock",
    description: "Schmales Kettenarmband, gut kombinierbar mit anderen Armbaendern.",
    details: ["Material: Legierung, vergoldet", "Laenge: 15-18 cm verstellbar", "Verschluss: Federring"],
    images: [
      "https://images.pexels.com/photos/16304539/pexels-photo-16304539.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/266621/pexels-photo-266621.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-perle",
    name: "Armband Perle",
    category: "Armbaender",
    price: 11.9,
    compareAt: null,
    badge: null,
    rating: 4.3,
    reviewCount: 14,
    stock: "low_stock",
    description: "Armband mit kleinen Kunstperlen an duenner Kette.",
    details: ["Material: Legierung, rhodiniert", "Perlen: Kunstperlen 4 mm", "Laenge: 17-19 cm verstellbar"],
    images: [
      "https://images.pexels.com/photos/266621/pexels-photo-266621.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2879829/pexels-photo-2879829.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    id: "bracelet-vibe",
    name: "Armband Vibe",
    category: "Armbaender",
    price: 14.9,
    compareAt: null,
    badge: "Neu",
    rating: 4.7,
    reviewCount: 8,
    stock: "in_stock",
    description: "Breites Statement-Armband mit strukturierter Oberflaeche.",
    details: ["Material: Legierung, vergoldet", "Laenge: 18-21 cm verstellbar", "Verschluss: Karabiner"],
    images: [
      "https://images.pexels.com/photos/2879829/pexels-photo-2879829.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/12194325/pexels-photo-12194325.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  }
];

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function stockLabel(stock) {
  if (stock === "low_stock") return { key: "stock_low", cls: "low" };
  if (stock === "out_of_stock") return { key: "stock_out", cls: "out" };
  return { key: "stock_in", cls: "in" };
}

function translateCategory(category) {
  const lang = getLang();
  if (lang === "de") return category;
  return (CATEGORY_TRANSLATIONS[category] && CATEGORY_TRANSLATIONS[category][lang]) || category;
}

// Liefert die Produkttexte (Kategorie, Beschreibung, Details) in der aktuellen Sprache.
// Deutsch ist in PRODUCTS hinterlegt, Englisch/Franzoesisch kommen aus PRODUCT_TRANSLATIONS.
function getProductText(product) {
  const lang = getLang();
  if (lang === "de") {
    return { category: product.category, description: product.description, details: product.details };
  }
  const override = PRODUCT_TRANSLATIONS[product.id] && PRODUCT_TRANSLATIONS[product.id][lang];
  if (!override) {
    return { category: product.category, description: product.description, details: product.details };
  }
  return {
    category: CATEGORY_TRANSLATIONS[product.category][lang],
    description: override.description,
    details: override.details
  };
}
