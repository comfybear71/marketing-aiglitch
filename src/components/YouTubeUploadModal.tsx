"use client";

import { useEffect, useState } from "react";

export type YouTubePrivacyStatus = "public" | "private" | "unlisted";

export interface YouTubeUploadForm {
  title: string;
  description: string;
  privacyStatus: YouTubePrivacyStatus;
}

interface YouTubeUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: YouTubeUploadForm) => Promise<void>;
  submitting: boolean;
  result: { ok: boolean; message: string } | null;
}

const PRIVACY_OPTIONS: { value: YouTubePrivacyStatus; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Anyone can search for and view" },
  { value: "unlisted", label: "Unlisted", hint: "Anyone with the link can view" },
  { value: "private", label: "Private", hint: "Only you can view" },
];

export function YouTubeUploadModal({
  open,
  onClose,
  onSubmit,
  submitting,
  result,
}: YouTubeUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacyStatus>("public");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPrivacyStatus("public");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    await onSubmit({ title: title.trim(), description: description.trim(), privacyStatus });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yt-upload-title"
    >
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 id="yt-upload-title" className="text-base font-bold text-white">
              Upload to YouTube
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Title, description, and visibility are required by YouTube API policy.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-2 py-1 text-gray-400 hover:text-white text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="yt-title" className="text-[11px] font-bold text-gray-400 block mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="yt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              placeholder="Video title"
              className="ad-input"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="yt-desc" className="text-[11px] font-bold text-gray-400 block mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="yt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="Video description"
              className="ad-input resize-y min-h-[96px]"
              disabled={submitting}
            />
          </div>

          <fieldset>
            <legend className="text-[11px] font-bold text-gray-400 mb-2">
              Privacy <span className="text-red-400">*</span>
            </legend>
            <div className="space-y-2">
              {PRIVACY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    privacyStatus === opt.value
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="yt-privacy"
                    value={opt.value}
                    checked={privacyStatus === opt.value}
                    onChange={() => setPrivacyStatus(opt.value)}
                    disabled={submitting}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-sm font-bold text-white block">{opt.label}</span>
                    <span className="text-[10px] text-gray-500">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {result && (
            <div
              className={`text-xs rounded-lg px-3 py-2 border ${
                result.ok
                  ? "bg-green-500/10 border-green-500/30 text-green-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? "Uploading…" : "Upload video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
