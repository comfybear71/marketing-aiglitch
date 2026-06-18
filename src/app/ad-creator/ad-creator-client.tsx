"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AD_BRIEF_STATUS_VALUES,
  statusMeta,
  type AdBrief,
  type AdBriefStatus,
} from "@/lib/ads-types";
import { createBrief, listBriefs, ApiError } from "@/lib/ads-api";

export function AdCreatorClient() {
  const [briefs, setBriefs] = useState<AdBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdBriefStatus | "">("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBriefs({
        status: statusFilter || undefined,
        includeArchived,
        limit: 200,
      });
      setBriefs(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, includeArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Ad Creator
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Brief → assets → generated MP4. Posts to the AIG!itch For You feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="shrink-0 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90"
        >
          + New brief
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            statusFilter === ""
              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800"
          }`}
        >
          All
        </button>
        {AD_BRIEF_STATUS_VALUES.filter((s) => s !== "archived").map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              statusFilter === s
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800"
            }`}
          >
            {statusMeta(s).label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="accent-purple-500"
          />
          Show archived
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse py-12 text-center">
          Loading briefs…
        </div>
      ) : briefs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-3">{"\u{1F3AC}"}</div>
          <p className="text-gray-400 font-bold mb-1">No briefs yet</p>
          <p className="text-gray-600 text-sm">
            Create your first brief to start making ads.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {briefs.map((b) => (
            <BriefCard key={b.id} brief={b} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBriefModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function BriefCard({ brief }: { brief: AdBrief }) {
  const meta = statusMeta(brief.status);
  return (
    <Link
      href={`/ad-creator/${brief.id}`}
      className="block rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 hover:bg-gray-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-sm truncate">{brief.title || "Untitled"}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.classes}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-purple-300/80 text-xs font-mono mb-2 truncate">
        {brief.project_name}
      </p>
      {brief.concept && (
        <p className="text-gray-500 text-xs line-clamp-3">{brief.concept}</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-600">
        {brief.last_video_url && <span className="text-green-400">{"\u{1F3A5}"} has video</span>}
        <span className="ml-auto">{new Date(brief.updated_at).toLocaleString()}</span>
      </div>
    </Link>
  );
}

function CreateBriefModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [concept, setConcept] = useState("");
  const [socials, setSocials] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !project.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createBrief({
        title: title.trim(),
        project_name: project.trim(),
        concept: concept.trim(),
        target_socials: socials.trim() || null,
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to create brief");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black mb-4">New brief</h2>
        {err && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {err}
          </div>
        )}
        <Field label="Title *">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. ShadeMate launch teaser"
            className="ad-input"
          />
        </Field>
        <Field label="Project name *">
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="e.g. shademate"
            className="ad-input"
          />
        </Field>
        <Field label="Concept">
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            rows={4}
            placeholder="What's the ad about? Tone, hook, key message…"
            className="ad-input resize-y"
          />
        </Field>
        <Field label="Target socials (CSV)" hint="e.g. feed,telegram,x">
          <input
            value={socials}
            onChange={(e) => setSocials(e.target.value)}
            placeholder="feed"
            className="ad-input"
          />
        </Field>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !title.trim() || !project.trim()}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-bold text-gray-400 mb-1">
        {label}
        {hint && <span className="ml-2 font-normal text-gray-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
