export type LandingTestimonialsSectionProps = {
  className?: string;
};

export type LandingOrbitPhotoCard = {
  kind: "photo";
  imageSrc: string;
  imageAlt: string;
  review: string;
};

export type LandingOrbitQuoteCard = {
  kind: "quote";
  theme: "lime" | "dark";
  quote: string;
  authorName: string;
  authorRole: string;
  avatarSrc: string;
};

export type LandingOrbitCard = LandingOrbitPhotoCard | LandingOrbitQuoteCard;
