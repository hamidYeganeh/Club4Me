export type DiscoveryClubLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

export type DiscoveryClub = {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: string;
  duration: string;
  distance: string;
  about: string;
  images: string[];
  map: DiscoveryClubLocation;
};
