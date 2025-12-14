import { useEffect, useMemo } from "react";

interface Props {
  name?: string;
  content: Uint8Array;
}

const EXTENSION_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

const SIGNATURE_TO_MIME: Array<{ mime: string; signature: number[] }> = [
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", signature: [0x47, 0x49, 0x46] },
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/webp", signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF
];

function detectMimeType(name: string | undefined, bytes: Uint8Array): string {
  const extension = name?.split(".").pop()?.toLowerCase();
  if (extension && EXTENSION_TO_MIME[extension]) {
    return EXTENSION_TO_MIME[extension];
  }

  for (const { mime, signature } of SIGNATURE_TO_MIME) {
    if (bytes.length >= signature.length) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return mime;
      }
    }
  }

  return "application/octet-stream";
}

export const ImgRenderer = ({ content, name }: Props) => {
  const { objectUrl, alt } = useMemo(() => {
    const mimeType = detectMimeType(name, content);
    const view = new Uint8Array(content.byteLength);
    view.set(content);
    const blob = new Blob([view.buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    return {
      objectUrl: url,
      alt: name ?? "image",
    };
  }, [content, name]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (!objectUrl) {
    return null;
  }

  return <img src={objectUrl} alt={alt} />;
};
