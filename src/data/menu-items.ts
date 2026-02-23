import type { MenuItem } from "@/types/menu";

export const menuItems: MenuItem[] = [
  // Pollos
  {
    id: "pollo-entero",
    categoryId: "pollos",
    name: { es: "Pollo Entero Rostizado", en: "Whole Roasted Chicken" },
    description: {
      es: "Pollo entero marinado con especias secretas, rostizado lentamente hasta quedar dorado y jugoso.",
      en: "Whole chicken marinated with secret spices, slowly roasted until golden and juicy.",
    },
    price: 189,
    image: "/images/menu/pollo-entero.webp",
    tags: ["popular"],
    available: true,
  },
  {
    id: "medio-pollo",
    categoryId: "pollos",
    name: { es: "Medio Pollo", en: "Half Chicken" },
    description: {
      es: "Media porción de nuestro pollo rostizado con el mismo sabor inigualable.",
      en: "Half portion of our roasted chicken with the same unmatched flavor.",
    },
    price: 109,
    image: "/images/menu/medio-pollo.webp",
    tags: [],
    available: true,
  },
  {
    id: "pierna-muslo",
    categoryId: "pollos",
    name: { es: "Pierna y Muslo", en: "Leg & Thigh" },
    description: {
      es: "Pieza de pierna con muslo, la parte más jugosa del pollo rostizado.",
      en: "Leg and thigh piece, the juiciest part of the roasted chicken.",
    },
    price: 69,
    image: "/images/menu/pierna-muslo.webp",
    tags: [],
    available: true,
  },
  {
    id: "pechuga",
    categoryId: "pollos",
    name: { es: "Pechuga Rostizada", en: "Roasted Breast" },
    description: {
      es: "Pechuga de pollo rostizada, tierna y llena de sabor.",
      en: "Roasted chicken breast, tender and full of flavor.",
    },
    price: 79,
    image: "/images/menu/pechuga.webp",
    tags: [],
    available: true,
  },
  {
    id: "pollo-picante",
    categoryId: "pollos",
    name: { es: "Pollo Picante", en: "Spicy Chicken" },
    description: {
      es: "Pollo rostizado bañado en nuestra salsa picante especial con chiles tatemados.",
      en: "Roasted chicken bathed in our special spicy sauce with roasted chiles.",
    },
    price: 199,
    image: "/images/menu/pollo-picante.webp",
    tags: ["spicy", "new"],
    available: true,
  },

  // Complementos
  {
    id: "arroz",
    categoryId: "complementos",
    name: { es: "Arroz Rojo", en: "Mexican Red Rice" },
    description: {
      es: "Arroz rojo mexicano preparado con jitomate y especias.",
      en: "Mexican red rice prepared with tomato and spices.",
    },
    price: 35,
    image: "/images/menu/arroz.webp",
    tags: [],
    available: true,
  },
  {
    id: "ensalada",
    categoryId: "complementos",
    name: { es: "Ensalada Fresca", en: "Fresh Salad" },
    description: {
      es: "Ensalada mixta con lechuga, jitomate, pepino y aderezo de la casa.",
      en: "Mixed salad with lettuce, tomato, cucumber and house dressing.",
    },
    price: 45,
    image: "/images/menu/ensalada.webp",
    tags: [],
    available: true,
  },
  {
    id: "frijoles",
    categoryId: "complementos",
    name: { es: "Frijoles Refritos", en: "Refried Beans" },
    description: {
      es: "Frijoles refritos con queso y totopos.",
      en: "Refried beans with cheese and tortilla chips.",
    },
    price: 30,
    image: "/images/menu/frijoles.webp",
    tags: [],
    available: true,
  },
  {
    id: "tortillas",
    categoryId: "complementos",
    name: { es: "Tortillas (6 pzas)", en: "Tortillas (6 pcs)" },
    description: {
      es: "Tortillas de maíz hechas a mano, calientitas.",
      en: "Handmade corn tortillas, served warm.",
    },
    price: 20,
    image: "/images/menu/tortillas.webp",
    tags: ["popular"],
    available: true,
  },
  {
    id: "papas",
    categoryId: "complementos",
    name: { es: "Papas Fritas", en: "French Fries" },
    description: {
      es: "Papas fritas crujientes con sal y limón.",
      en: "Crispy french fries with salt and lime.",
    },
    price: 40,
    image: "/images/menu/papas.webp",
    tags: [],
    available: true,
  },

  // Bebidas
  {
    id: "agua-fresca",
    categoryId: "bebidas",
    name: { es: "Agua Fresca (1L)", en: "Fresh Water (1L)" },
    description: {
      es: "Agua fresca del día: jamaica, horchata o limón.",
      en: "Fresh water of the day: hibiscus, horchata, or lime.",
    },
    price: 35,
    image: "/images/menu/agua-fresca.webp",
    tags: ["popular"],
    available: true,
  },
  {
    id: "refresco",
    categoryId: "bebidas",
    name: { es: "Refresco", en: "Soda" },
    description: {
      es: "Refresco de lata. Coca-Cola, Sprite, Fanta.",
      en: "Canned soda. Coca-Cola, Sprite, Fanta.",
    },
    price: 25,
    image: "/images/menu/refresco.webp",
    tags: [],
    available: true,
  },
  {
    id: "cerveza",
    categoryId: "bebidas",
    name: { es: "Cerveza", en: "Beer" },
    description: {
      es: "Cerveza nacional fría. Corona, Modelo, Victoria.",
      en: "Cold national beer. Corona, Modelo, Victoria.",
    },
    price: 40,
    image: "/images/menu/cerveza.webp",
    tags: [],
    available: true,
  },

  // Combos
  {
    id: "combo-familiar",
    categoryId: "combos",
    name: { es: "Combo Familiar", en: "Family Combo" },
    description: {
      es: "Pollo entero + arroz + frijoles + ensalada + tortillas + 1L agua fresca. Para 4-5 personas.",
      en: "Whole chicken + rice + beans + salad + tortillas + 1L fresh water. For 4-5 people.",
    },
    price: 299,
    image: "/images/menu/combo-familiar.webp",
    tags: ["popular"],
    available: true,
  },
  {
    id: "combo-pareja",
    categoryId: "combos",
    name: { es: "Combo Pareja", en: "Couple's Combo" },
    description: {
      es: "Medio pollo + arroz + ensalada + 2 refrescos. Para 2 personas.",
      en: "Half chicken + rice + salad + 2 sodas. For 2 people.",
    },
    price: 199,
    image: "/images/menu/combo-pareja.webp",
    tags: [],
    available: true,
  },
  {
    id: "combo-individual",
    categoryId: "combos",
    name: { es: "Combo Individual", en: "Individual Combo" },
    description: {
      es: "Pierna y muslo + arroz o frijoles + tortillas + refresco.",
      en: "Leg & thigh + rice or beans + tortillas + soda.",
    },
    price: 119,
    image: "/images/menu/combo-individual.webp",
    tags: ["new"],
    available: true,
  },
];
