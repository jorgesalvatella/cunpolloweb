export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type RestaurantInfo = {
  name: string;
  phone: string;
  email: string;
  address: Address;
  coordinates: Coordinates;
  hours: {
    weekdays: string;
    weekends: string;
  };
  social: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
};
