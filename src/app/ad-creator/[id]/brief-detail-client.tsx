"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AD_BRIEF_STATUS_VALUES,
  formatBytes,
  parseGenerationLog,
  statusMeta,
  totalEstimatedUsd,
  type AdBriefStatus,
  type AdBriefWithAssets,
  type GenerationResult,
} from "@/lib/ads-types";
import {
  archiveBrief,
  deleteAsset,
  generateBrief,
  getBrief,
  updateBrief,
  ApiError,
} from "@/lib/ads-api";
import { uploadBriefAsset } from "@/lib/blob-upload";

export function BriefDetailClient({ briefId }: { briefId: string }) {
  const router = useRouter();
  const [brief, setBrief] = useState<AdBriefWithAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const b = await getBrief(briefId);
      setBrief(b);
      setLoadError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setLoadError("Brief not found.");
      else setLoadError(e instanceof ApiError ? e.message : "Failed to load brief.");
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="text-gray-500 text-sm animate-pulse py-12">Loading brief…</div>;
  }
  if (loadError || !brief) {
    return (
      <div className="py-12">
        <BackLink />
        <p className="text-red-300 mt-6">{loadError ?? "Brief not found."}</p>
      </div>
    );
  }

  return <BriefDetail brief={brief} reload={load} onArchived={() => router.push("/ad-creator")} />;
}

function BackLink() {
  return (
    <Link href="/ad-creator" className="text-gray-400 hover:text-gray-200 text-sm">
      ← All briefs
    </Link>
  );
}

function BriefDetail({
  brief,
  reload,
  onArchived,
}: {
  brief: AdBriefWithAssets;
  reload: () => Promise<void>;
  onArchived: () => void;
}) {
  const meta = statusMeta(brief.status);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <BackLink />
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${meta.classes}`}>
          {meta.label}
        </span>
      </div>

      <EditSection brief={brief} reload={reload} onArchived={onArchived} />
      <AssetsSection brief={brief} reload={reload} />
      <GenerateSection brief={brief} reload={reload} />
      <DiagnosticsSection brief={brief} />
    </div>
  );
}

// ── Edit ────────────────────────────────────────────────────────────

function EditSection({
  brief,
  reload,
  onArchived,
}: {
  brief: AdBriefWithAssets;
  reload: () => Promise<void>;
  onArchived: () => void;
}) {
  const [title, setTitle] = useState(brief.title);
  const [project, setProject] = useState(brief.project_name);
  const [concept, setConcept] = useState(brief.concept);
  const [socials, setSocials] = useState(brief.target_socials ?? "");
  const [status, setStatus] = useState<AdBriefStatus>(brief.status);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const dirty =
    title !== brief.title ||
    project !== brief.project_name ||
    concept !== brief.concept ||
    (socials || "") !== (brief.target_socials ?? "") ||
    status !== brief.status;

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      await updateBrief(brief.id, {
        title: title.trim(),
        project_name: project.trim(),
        concept: concept.trim(),
        target_socials: socials.trim() || null,
        status,
      });
      setMsg("Saved");
      await reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!confirm("Archive this brief? It will be hidden from the default list.")) return;
    try {
      await archiveBrief(brief.id);
      onArchived();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Archive failed");
    }
  };

  return (
    <Section title="Brief">
      {err && <Banner kind="error">{err}</Banner>}
      <label className="block mb-3">
        <span className="block text-xs font-bold text-gray-400 mb-1">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="ad-input" />
      </label>
      <label className="block mb-3">
        <span className="block text-xs font-bold text-gray-400 mb-1">Project name</span>
        <input value={project} onChange={(e) => setProject(e.target.value)} className="ad-input" />
      </label>
      <label className="block mb-3">
        <span className="block text-xs font-bold text-gray-400 mb-1">Concept</span>
        <textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          rows={5}
          className="ad-input resize-y"
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-bold text-gray-400 mb-1">
            Target socials <span className="font-normal text-gray-600">CSV</span>
          </span>
          <input value={socials} onChange={(e) => setSocials(e.target.value)} className="ad-input" />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-gray-400 mb-1">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdBriefStatus)}
            className="ad-input"
          >
            {AD_BRIEF_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {statusMeta(s).label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="text-green-400 text-xs">{msg}</span>}
        <button
          type="button"
          onClick={archive}
          className="ml-auto px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20"
        >
          Archive
        </button>
      </div>
    </Section>
  );
}

// ── Assets ──────────────────────────────────────────────────────────

function AssetsSection({
  brief,
  reload,
}: {
  brief: AdBriefWithAssets;
  reload: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    try {
      const list = Array.from(files);
      for (let i = 0; i < list.length; i++) {
        setProgress(`Uploading ${i + 1}/${list.length}: ${list[i].name}`);
        await uploadBriefAsset(brief.id, list[i]);
      }
      setProgress(null);
      // Asset rows are inserted by the Blob completion webhook — give it
      // a beat, then reload so the new assets show.
      await new Promise((r) => setTimeout(r, 1200));
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (assetId: string) => {
    try {
      await deleteAsset(brief.id, assetId);
      await reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  return (
    <Section title={`Assets (${brief.assets.length})`}>
      <p className="text-gray-500 text-xs mb-3">
        Existing video / images to mix with AI-generated clips. Images & video up to 500 MB.
      </p>
      {err && <Banner kind="error">{err}</Banner>}

      {brief.assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {brief.assets.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {a.asset_type === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={a.blob_url} className="w-full h-full object-contain" controls preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.blob_url} alt={a.original_filename} className="w-full h-full object-contain" />
                )}
              </div>
              <div className="p-2">
                <p className="text-[10px] text-gray-400 truncate" title={a.original_filename}>
                  {a.original_filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-600">
                    {a.asset_type} · {formatBytes(a.size_bytes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        disabled={uploading}
        onChange={(e) => onFiles(e.target.files)}
        className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-gray-200 file:font-bold hover:file:bg-gray-700 disabled:opacity-50"
      />
      {progress && <p className="text-yellow-300 text-xs mt-2 animate-pulse">{progress}</p>}
    </Section>
  );
}

// ── Generate ────────────────────────────────────────────────────────

function GenerateSection({
  brief,
  reload,
}: {
  brief: AdBriefWithAssets;
  reload: () => Promise<void>;
}) {
  const [maxCost, setMaxCost] = useState("5");
  const [advanced, setAdvanced] = useState(false);
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setErr(null);
    setResult(null);
    setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    try {
      const cost = parseFloat(maxCost);
      const res = await generateBrief(brief.id, {
        maxCostUsd: Number.isFinite(cost) && cost > 0 ? cost : undefined,
        avatarId: advanced && avatarId.trim() ? avatarId.trim() : undefined,
        voiceId: advanced && voiceId.trim() ? voiceId.trim() : undefined,
      });
      setResult(res);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Generation request failed");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      await reload();
    }
  };

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Section title="Generate">
      <p className="text-gray-500 text-xs mb-3">
        Claude script → HeyGen anchor → Grok b-roll → ffmpeg stitch → Blob → For You feed post.
        Runs synchronously, typically 3-4 min. You can leave this page — the result is saved to the
        brief; come back and Refresh.
      </p>
      {err && <Banner kind="error">{err}</Banner>}

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="block">
          <span className="block text-xs font-bold text-gray-400 mb-1">Cost cap (USD)</span>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            className="ad-input w-32"
          />
        </label>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {running ? `Generating… ${mm}:${ss}` : "🎬 Generate ad"}
        </button>
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          {advanced ? "Hide" : "Show"} advanced
        </button>
      </div>

      {advanced && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="block text-xs font-bold text-gray-400 mb-1">
              HeyGen avatar ID <span className="font-normal text-gray-600">override</span>
            </span>
            <input value={avatarId} onChange={(e) => setAvatarId(e.target.value)} className="ad-input" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-gray-400 mb-1">
              HeyGen voice ID <span className="font-normal text-gray-600">override</span>
            </span>
            <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="ad-input" />
          </label>
        </div>
      )}

      {running && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm">
          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" />
          Generating — {mm}:{ss} elapsed. Keep this tab open, or come back later and Refresh.
        </div>
      )}

      {result && (
        <Banner kind={result.status === "posted" ? "success" : "error"}>
          {result.status === "posted"
            ? `✅ Posted! ${result.post_id ? `Feed post ${result.post_id}` : ""}`
            : `❌ Generation failed: ${result.error ?? "unknown error"}`}
        </Banner>
      )}
    </Section>
  );
}

// ── Diagnostics ─────────────────────────────────────────────────────

function DiagnosticsSection({ brief }: { brief: AdBriefWithAssets }) {
  const log = parseGenerationLog(brief.generation_log);
  const estTotal = totalEstimatedUsd(log);
  const hasAnything =
    brief.last_video_url || brief.last_error || log.length > 0 || brief.last_generation_at;

  if (!hasAnything) {
    return (
      <Section title="Diagnostics">
        <p className="text-gray-600 text-sm">No generation runs yet.</p>
      </Section>
    );
  }

  return (
    <Section title="Diagnostics">
      {brief.last_generation_at && (
        <p className="text-gray-500 text-xs mb-3">
          Last run: {new Date(brief.last_generation_at).toLocaleString()}
          {estTotal > 0 && <> · est. ${estTotal.toFixed(2)}</>}
        </p>
      )}

      {brief.last_video_url && (
        <div className="mb-4">
          <span className="block text-xs font-bold text-gray-400 mb-1">Last video</span>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={brief.last_video_url}
            controls
            preload="metadata"
            className="w-full max-w-md rounded-xl border border-gray-800 bg-black"
          />
          <a
            href={brief.last_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-xs text-purple-300 hover:text-purple-200"
          >
            Open in new tab ↗
          </a>
        </div>
      )}

      {brief.last_error && (
        <Banner kind="error">
          <span className="font-bold">Last error:</span> {brief.last_error}
        </Banner>
      )}

      {log.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="py-1.5 pr-3 font-bold">Step</th>
                <th className="py-1.5 pr-3 font-bold">Status</th>
                <th className="py-1.5 pr-3 font-bold">Est. $</th>
                <th className="py-1.5 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {log.map((e, i) => (
                <tr key={i} className="border-b border-gray-900">
                  <td className="py-1.5 pr-3 text-gray-300">{e.step}</td>
                  <td className={`py-1.5 pr-3 ${e.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {e.status}
                  </td>
                  <td className="py-1.5 pr-3 text-gray-400">
                    {typeof e.estimated_usd === "number" ? `$${e.estimated_usd.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-1.5 text-gray-500 break-all">
                    {e.error ? <span className="text-red-400">{e.error}</span> : e.video_url ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
      <h2 className="text-sm font-black text-gray-300 mb-3 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Banner({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const classes =
    kind === "error"
      ? "bg-red-500/10 border-red-500/30 text-red-300"
      : "bg-green-500/10 border-green-500/30 text-green-300";
  return <div className={`mb-3 p-3 rounded-xl border text-sm ${classes}`}>{children}</div>;
}
