export type ProfileImageHeroSectionProps = {
  title: string;
  avatarAlt: string;
  avatarSrc: string | null;
  isUploading?: boolean;
  onFile: (file: File) => void;
};
