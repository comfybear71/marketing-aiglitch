"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  YouTubeUploadModal,
  type YouTubeUploadForm,
} from "@/components/YouTubeUploadModal";
import { CONSUMER_URL } from "@/lib/consumer-url";
import type { MarketingStats, MktPlatformAccount } from "@/lib/mktg-types";

const PLATFORMS = [
  { id: "x", name: "X (Twitter)", emoji: "𝕏", border: "border-gray-600" },
  { id: "instagram", name: "Instagram", emoji: "📸", border: "border-pink-500" },
  { id: "facebook", name: "Facebook", emoji: "📘", border: "border-blue-500" },
  { id: "youtube", name: "YouTube", emoji: "▶️", border: "border-red-500" },
] as const;

const YT_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Admin login required before connecting YouTube.",
  no_code: "Google did not return an authorization code.",
  not_configured: "YouTube OAuth is not configured on the API (missing client ID/secret).",
  token_failed: "Google token exchange failed — try reconnecting.",
  oauth_failed: "YouTube OAuth failed — check API logs.",
};

export default function MarketingClient() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [accounts, setAccounts] = useState<MktPlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [ytModalOpen, setYtModalOpen] = useState(false);
  const [ytSubmitting, setYtSubmitting] = useState(false);
  const [ytResult, setYtResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [simpleModal, setSimpleModal] = useState<{
    platform: string;
    mediaType?: "image" | "video";
  } | null>(null);
  const [simpleMessage, setSimpleMessage] = useState("");
  const [simpleSubmitting, setSimpleSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, accountsRes] = await Promise.all([
        fetch("/api/admin/mktg?action=stats", { credentials: "include" }),
        fetch("/api/admin/mktg?action=accounts", { credentials: "include" }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("[marketing] fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ytSuccess = searchParams.get("yt_success");
    const ytError = searchParams.get("yt_error");
    if (ytSuccess === "connected") {
      setBanner({ tone: "ok", text: "YouTube connected successfully." });
      fetchData();
      window.history.replaceState({}, "", "/marketing");
    } else if (ytError) {
      setBanner({
        tone: "err",
        text: YT_ERROR_MESSAGES[ytError] || `YouTube connect failed (${ytError}).`,
      });
      window.history.replaceState({}, "", "/marketing");
    }
  }, [searchParams, fetchData]);

  const youtubeAccount = accounts.find((a) => a.platform === "youtube");

  const disconnectYouTube = async () => {
    if (
      !window.confirm(
        "Disconnect YouTube? This revokes stored OAuth tokens. You can reconnect anytime.",
      )
    ) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/mktg", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect_youtube" }),
      });
      const data = await res.json();
      if (data.ok) {
        setBanner({ tone: "ok", text: "YouTube disconnected." });
        fetchData();
      } else {
        setBanner({ tone: "err", text: data.error || "Disconnect failed." });
      }
    } catch {
      setBanner({ tone: "err", text: "Disconnect request failed." });
    }
    setDisconnecting(false);
  };

  const submitYouTubeUpload = async (form: YouTubeUploadForm) => {
    setYtSubmitting(true);
    setYtResult(null);
    try {
      const res = await fetch("/api/admin/mktg", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_post",
          platform: "youtube",
          title: form.title,
          description: form.description,
          privacyStatus: form.privacyStatus,
          mediaType: "video",
        }),
      });
      const raw = await res.text();
      let data: { success?: boolean; error?: string; platformUrl?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setYtResult({
          ok: false,
          message:
            raw.slice(0, 200) ||
            `Upload failed (HTTP ${res.status}). If this persists, call the API on port 3000 directly — the marketing proxy may have timed out.`,
        });
        return;
      }
      if (data.success) {
        setYtResult({
          ok: true,
          message: `Upload succeeded! ${data.platformUrl || ""}`.trim(),
        });
        fetchData();
      } else {
        setYtResult({
          ok: false,
          message: data.error || `Upload failed (HTTP ${res.status})`,
        });
      }
    } catch (err) {
      setYtResult({
        ok: false,
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
    setYtSubmitting(false);
  };

  const openYouTubeModal = () => {
    setYtResult(null);
    setYtModalOpen(true);
  };

  const submitSimplePost = async () => {
    if (!simpleModal || !simpleMessage.trim()) return;
    setSimpleSubmitting(true);
    try {
      const body: Record<string, string> = {
        action: "test_post",
        platform: simpleModal.platform,
        message: simpleMessage.trim(),
      };
      if (simpleModal.mediaType) body.mediaType = simpleModal.mediaType;

      const res = await fetch("/api/admin/mktg", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${simpleModal.platform} test succeeded! ${data.platformUrl || ""}`);
        setSimpleModal(null);
        setSimpleMessage("");
        fetchData();
      } else {
        alert(data.error || "Test post failed.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Test post failed.");
    }
    setSimpleSubmitting(false);
  };

  const openSimpleModal = (platform: string, mediaType?: "image" | "video") => {
    const defaultMsg =
      mediaType === "image"
        ? "Check this out from AIG!itch aiglitch.app #AIGlitch #AI"
        : mediaType === "video"
          ? "New clip from AIG!itch aiglitch.app #AIGlitch #AI"
          : `Test post from AIG!itch — ${new Date().toLocaleString()}`;
    setSimpleMessage(defaultMsg);
    setSimpleModal({ platform, mediaType });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
            Social Platforms
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Connect accounts and test cross-platform posting (admin only).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {banner && (
        <div
          className={`text-sm rounded-xl px-4 py-3 border ${
            banner.tone === "ok"
              ? "bg-green-500/10 border-green-500/30 text-green-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {banner.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl animate-pulse mb-2">📡</div>
          <p>Loading platform data…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: "Posted", value: stats?.totalPosted ?? 0, color: "text-green-400" },
              { label: "Queued", value: stats?.totalQueued ?? 0, color: "text-yellow-400" },
              { label: "Failed", value: stats?.totalFailed ?? 0, color: "text-red-400" },
              { label: "Impressions", value: stats?.totalImpressions ?? 0, color: "text-cyan-400" },
              { label: "Likes", value: stats?.totalLikes ?? 0, color: "text-pink-400" },
              { label: "Views", value: stats?.totalViews ?? 0, color: "text-purple-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center"
              >
                <div className={`text-lg font-bold ${s.color}`}>
                  {s.value.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORMS.map((p) => {
              const account = accounts.find((a) => a.platform === p.id);
              const pStats = stats?.platformBreakdown?.find((s) => s.platform === p.id);
              const isYoutube = p.id === "youtube";

              return (
                <div
                  key={p.id}
                  className={`bg-gray-900/50 border-t-2 ${p.border} border border-gray-800 rounded-xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-sm font-bold">{p.name}</span>
                    <span
                      className={`ml-auto text-[10px] font-bold ${
                        account?.is_active ? "text-green-400" : "text-gray-600"
                      }`}
                    >
                      {account?.is_active ? "Connected" : "Not connected"}
                    </span>
                  </div>

                  {account?.account_name && (
                    <p className="text-xs text-gray-400 mb-2">
                      Account:{" "}
                      {account.account_url ? (
                        <a
                          href={account.account_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          {account.account_name}
                        </a>
                      ) : (
                        account.account_name
                      )}
                    </p>
                  )}

                  <div className="flex gap-3 text-[10px] text-gray-500 mb-3">
                    <span>Posted {pStats?.posted ?? 0}</span>
                    <span>Impressions {(pStats?.impressions ?? 0).toLocaleString()}</span>
                  </div>

                  {isYoutube && (
                    <div className="mb-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700 text-[10px] text-gray-400 leading-relaxed space-y-2">
                      <p>
                        <strong className="text-gray-300">YouTube API disclosure:</strong>{" "}
                        Connecting uses Google OAuth and the YouTube Data API to upload videos
                        on behalf of platform administrators only. See our{" "}
                        <a
                          href={`${CONSUMER_URL}/privacy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          Privacy Policy
                        </a>{" "}
                        and Google&apos;s{" "}
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          Privacy Policy
                        </a>
                        . Revoke access anytime with Disconnect.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="/api/auth/youtube"
                          className="inline-flex px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg font-bold hover:bg-red-600/30"
                        >
                          {account?.is_active ? "Reconnect YouTube" : "Connect YouTube"}
                        </a>
                        {account?.is_active && (
                          <button
                            type="button"
                            onClick={disconnectYouTube}
                            disabled={disconnecting}
                            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg font-bold hover:bg-gray-600 disabled:opacity-50"
                          >
                            {disconnecting ? "Disconnecting…" : "Disconnect"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {isYoutube ? (
                      <button
                        type="button"
                        onClick={openYouTubeModal}
                        disabled={!account?.is_active}
                        className="w-full px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-500/30 disabled:opacity-40"
                      >
                        Upload test video
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openSimpleModal(p.id)}
                          className="w-full px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/30"
                        >
                          Test post
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openSimpleModal(p.id, "image")}
                            className="flex-1 px-2 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30"
                          >
                            Image
                          </button>
                          <button
                            type="button"
                            onClick={() => openSimpleModal(p.id, "video")}
                            className="flex-1 px-2 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/30"
                          >
                            Video
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <YouTubeUploadModal
        open={ytModalOpen}
        onClose={() => !ytSubmitting && setYtModalOpen(false)}
        onSubmit={submitYouTubeUpload}
        submitting={ytSubmitting}
        result={ytResult}
      />

      {simpleModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">
              Test {simpleModal.mediaType || "post"} — {simpleModal.platform}
            </h3>
            <textarea
              value={simpleMessage}
              onChange={(e) => setSimpleMessage(e.target.value)}
              rows={4}
              className="ad-input resize-y mb-3"
              disabled={simpleSubmitting}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimpleModal(null)}
                disabled={simpleSubmitting}
                className="flex-1 py-2 bg-gray-800 rounded-xl text-sm font-bold text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSimplePost}
                disabled={simpleSubmitting || !simpleMessage.trim()}
                className="flex-1 py-2 bg-cyan-600 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              >
                {simpleSubmitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
