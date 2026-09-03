"use client";

import { Editor } from "@tinymce/tinymce-react";

type ArticlesEditorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

const TINYMCE_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/tinymce@8.9.0/tinymce.min.js";

export function ArticlesEditorField({
  value,
  onChange,
  disabled,
  id,
}: ArticlesEditorFieldProps) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Editor
        id={id}
        {...(apiKey
          ? { apiKey }
          : {
              licenseKey: "gpl",
              tinymceScriptSrc: TINYMCE_SCRIPT_SRC,
            })}
        value={value}
        disabled={disabled}
        onEditorChange={onChange}
        init={{
          height: 420,
          menubar: false,
          branding: false,
          promotion: false,
          directionality: "rtl",
          plugins: "lists link image table code fullscreen directionality",
          toolbar:
            "undo redo | blocks | bold italic underline | alignright aligncenter alignleft | bullist numlist | link image table | removeformat | code fullscreen",
          content_style:
            "body { font-family: inherit; font-size: 15px; line-height: 1.7; direction: rtl; }",
        }}
      />
    </div>
  );
}
