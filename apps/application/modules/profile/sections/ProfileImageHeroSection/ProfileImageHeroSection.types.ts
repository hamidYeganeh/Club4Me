export type ProfileImageHeroSectionProps = {
  title: string;
  avatarAlt: string;
  avatarSrc: string | null;
  fallback: string;
  onFile: (file: File) => void;
};
