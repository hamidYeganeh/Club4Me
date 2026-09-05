"use client";

import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";

export type MediaImageAdapterProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
  onError?: () => void;
};

export type MediaImageAdapter = ComponentType<MediaImageAdapterProps>;

const MediaImageAdapterContext = createContext<MediaImageAdapter | null>(null);

/** Next apps register `next/image` here; Vite/admin keeps the default `<img>`. */
export function MediaImageProvider({
  adapter,
  children,
}: {
  adapter: MediaImageAdapter;
  children: ReactNode;
}) {
  return (
    <MediaImageAdapterContext.Provider value={adapter}>
      {children}
    </MediaImageAdapterContext.Provider>
  );
}

export function useMediaImageAdapter(): MediaImageAdapter | null {
  return useContext(MediaImageAdapterContext);
}
