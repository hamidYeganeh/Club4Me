"use client";

import { useState } from "react";
import { Button, TextArea } from "@heroui/react";
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      {failed ? (
        <div className="space-y-3 p-4">
          <p role="alert" className="text-sm text-danger">
            ویرایشگر بارگذاری نشد. متن مقاله حفظ شده است؛ می‌توانی دوباره تلاش
            کنی یا محتوای HTML را در کادر زیر ویرایش کنی.
          </p>
          <Button
            variant="secondary"
            onPress={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            تلاش دوباره
          </Button>
          <TextArea
            aria-label="محتوای HTML مقاله"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            rows={12}
            className="w-full"
          />
        </div>
      ) : (
        <Editor
          key={attempt}
          onScriptsLoadError={() => setFailed(true)}
          onSkinLoadError={() => setFailed(true)}
          onThemeLoadError={() => setFailed(true)}
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
      )}
    </div>
  );
}
