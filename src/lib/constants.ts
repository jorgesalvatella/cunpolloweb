export const FEATURES = {
  ORDERING_ENABLED: true,
  DELIVERY_ENABLED: false,
  PWA_ENABLED: true,
  WHATSAPP_NOTIFICATIONS: true,
} as const;

export const RESTAURANT = {
  name: "CUNPOLLO",
  tagline: { es: "Pollo que salva tu día", en: "Chicken that saves your day" },
  phone: "+52 998 148 8987",
  email: "contacto@cunpollo.com",
  address: {
    street: "Av. Rodrigo Gómez, Supermanzana 13, Mza 1, Lote 6",
    city: "Cancún",
    state: "Q.R.",
    zip: "77500",
    country: "MX",
  },
  coordinates: { lat: 21.1355286, lng: -86.8307262 },
  hours: {
    weekdays: "13:00 - 21:00",
    weekends: "13:00 - 21:00",
  },
  social: {
    facebook: "https://facebook.com/cunpollomx",
    instagram: "https://instagram.com/cunpollomx",
    tiktok: "https://tiktok.com/@cunpollomx",
  },
} as const;
