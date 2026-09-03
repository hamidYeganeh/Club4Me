type CoverImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function CoverImage({
  src,
  alt,
  priority = false,
  className = "absolute inset-0 size-full object-cover",
}: CoverImageProps) {
  return (
    // Native img avoids Next image optimizer SSRF checks on remote hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
