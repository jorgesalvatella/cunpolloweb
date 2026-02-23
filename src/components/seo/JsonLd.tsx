import { RESTAURANT } from "@/lib/constants";

export function RestaurantJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: RESTAURANT.name,
    image: "https://cunpollo.com/logo.png",
    telephone: RESTAURANT.phone,
    email: RESTAURANT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: RESTAURANT.address.street,
      addressLocality: RESTAURANT.address.city,
      addressRegion: RESTAURANT.address.state,
      postalCode: RESTAURANT.address.zip,
      addressCountry: RESTAURANT.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: RESTAURANT.coordinates.lat,
      longitude: RESTAURANT.coordinates.lng,
    },
    servesCuisine: "Mexican, Roasted Chicken",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "10:00",
        closes: "22:00",
      },
    ],
    url: "https://cunpollo.com",
    sameAs: [
      RESTAURANT.social.facebook,
      RESTAURANT.social.instagram,
      RESTAURANT.social.tiktok,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function MenuJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "CUNPOLLO Menu",
    description: "Pollo rostizado artesanal y complementos.",
    url: "https://cunpollo.com/es/menu",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Pollos",
        description: "Pollo rostizado en diferentes presentaciones",
      },
      {
        "@type": "MenuSection",
        name: "Complementos",
        description: "Acompañamientos y guarniciones",
      },
      {
        "@type": "MenuSection",
        name: "Bebidas",
        description: "Refrescos, aguas frescas y cervezas",
      },
      {
        "@type": "MenuSection",
        name: "Combos",
        description: "Paquetes familiares y para pareja",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
