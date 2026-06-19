"use client";

/**
 * Route-segment error boundary. Catches any render/runtime error thrown
 * by a page under the root layout and shows a contained, retryable
 * message *inside* the shell — instead of letting the error unmount the
 * whole app (which is what produced the full-page "This page couldn't
 * load" with no sidebar). The layout + sidebar stay mounted because this
 * boundary wraps only the page segment.
 */

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[marketing] page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-3">{"⚠️"}</div>
      <h2 className="text-xl font-black mb-2">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          This tab hit an error
        </span>
      </h2>
      <p className="text-gray-400 text-sm max-w-md mb-1">
        Something threw while rendering this page. The rest of the app is fine —
        you can retry or switch tabs in the sidebar.
      </p>
      {error?.message && (
        <p className="text-gray-600 text-xs font-mono max-w-md mb-4 break-words">
          {error.message}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90"
      >
        Retry
      </button>
    </div>
  );
}
