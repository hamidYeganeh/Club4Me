import type { Accept } from "react-dropzone";

export const imageUploaderAccept: Accept = {
  "image/svg+xml": [".svg"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export type UploaderFileStatus = "uploading" | "success" | "error";

export type UploaderFile = {
  id: string;
  name: string;
  size: number;
  loaded: number;
  progress: number;
  status: UploaderFileStatus;
  file?: File;
};

export type UploaderLabels = {
  clickToUpload: string;
  dropHint: string;
  formats: string;
  progress: string;
  success: string;
  error: string;
  retry: string;
  remove: string;
  dropzoneAria: string;
};

export type UploaderUploadHelpers = {
  onProgress: (loaded: number, total: number) => void;
};

export type UploaderProps = {
  files?: UploaderFile[];
  accept?: Accept;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  labels?: Partial<UploaderLabels>;
  onDrop?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onUpload?: (file: File, helpers: UploaderUploadHelpers) => Promise<void>;
  onBrowseRequest?: (openFileDialog: () => void) => void;
};
