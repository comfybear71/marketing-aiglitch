/**
 * Safari-safe Vercel Blob client upload.
 *
 * Ported from admin-aiglitch's `safariSafeBlobUpload`. Two browser
 * quirks it works around:
 *
 *  1. Safari/WebKit mis-handles JSON string bodies in fetch(), which
 *     breaks the @vercel/blob client's handshake with our upload
 *     handler. We temporarily wrap the JSON body in FormData (the
 *     backend's handleUpload unwraps `__json`). Chrome/Firefox skip
 *     this path entirely.
 *  2. iOS Safari reports empty / wrong MIME types for camera-roll
 *     files — we repair the File's type from its extension first.
 *
 * Client-only (touches window/navigator). Import from "use client"
 * components.
 */

import type { PutBlobResult } from "@vercel/blob";

export const isSafari =
  typeof navigator !== "undefined" &&
  (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Macintosh — detect via touch + webkit
    (navigator.maxTouchPoints > 0 &&
      /AppleWebKit/.test(navigator.userAgent) &&
      !/Chrome/.test(navigator.userAgent)));

/** iOS Safari sometimes reports empty/wrong MIME types for media. */
function fixIOSFileType(file: File): File {
  if (file.type && file.type !== "application/octet-stream") return file;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", heic: "image/heic", heif: "image/heif", avif: "image/avif",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska",
  };
  const correctType = typeMap[ext];
  return correctType
    ? new File([file], file.name, { type: correctType, lastModified: file.lastModified })
    : file;
}

export async function safariSafeBlobUpload(
  pathname: string,
  file: File,
  opts: { access: "public"; handleUploadUrl: string; multipart: boolean; clientPayload?: string },
): Promise<PutBlobResult> {
  const { upload } = await import("@vercel/blob/client");

  if (!isSafari) {
    return upload(pathname, file, opts);
  }

  const fixedFile = fixIOSFileType(file);
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (
      url.includes(opts.handleUploadUrl) &&
      init?.body &&
      typeof init.body === "string"
    ) {
      const form = new FormData();
      form.append("__json", init.body);
      const preserved = new Headers(init.headers || {});
      preserved.delete("content-type");
      return originalFetch(input, { ...init, body: form, headers: preserved });
    }
    return originalFetch(input, init);
  };

  try {
    return await upload(pathname, fixedFile, opts);
  } finally {
    window.fetch = originalFetch;
  }
}

/**
 * Upload one asset for a brief. Builds the brief-scoped blob path the
 * backend's token handler requires (`ad-briefs/<briefId>/...`) and
 * sanitises the filename (iOS makes very long path-like names).
 * Returns the public blob URL. The backend's onUploadCompleted webhook
 * inserts the asset row, so re-fetch the brief after this resolves.
 */
export async function uploadBriefAsset(briefId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const cleanName =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80) + "." + ext;
  const pathname = `ad-briefs/${briefId}/${cleanName}`;
  const blob = await safariSafeBlobUpload(pathname, file, {
    access: "public",
    handleUploadUrl: `/api/admin/ads/${briefId}/upload`,
    multipart: true,
    clientPayload: file.type || "application/octet-stream",
  });
  return blob.url;
}
