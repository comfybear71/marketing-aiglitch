/**
 * Ad Creator — shared types + pure helpers.
 *
 * Types mirror the backend contract in aiglitch-api
 * (`src/lib/content/ad-briefs.ts`). Keep them in sync with that file —
 * it is the source of truth. The helpers here are pure (no fetch, no
 * DOM) so they're unit-testable and safe to import from server or
 * client components.
 */

export type AdBriefStatus =
  | "draft"
  | "generating"
  | "ready"
  | "posted"
  | "failed"
  | "archived";

export const AD_BRIEF_STATUS_VALUES: AdBriefStatus[] = [
  "draft",
  "generating",
  "ready",
  "posted",
  "failed",
  "archived",
];

export interface AdBrief {
  id: string;
  title: string;
  project_name: string;
  concept: string;
  status: AdBriefStatus;
  target_socials: string | null; // CSV: "telegram,x,feed"
  last_video_url: string | null;
  last_post_id: string | null;
  last_error: string | null;
  last_generation_at: string | null;
  generation_log: string | null; // JSON-serialized GenerationLogEntry[]
  created_at: string;
  updated_at: string;
}

export interface AdBriefAsset {
  id: string;
  ad_brief_id: string;
  asset_type: "image" | "video";
  blob_url: string;
  original_filename: string;
  size_bytes: number | null;
  created_at: string;
}

export interface AdBriefWithAssets extends AdBrief {
  assets: AdBriefAsset[];
}

export interface GenerationLogEntry {
  step: string;
  status: "ok" | "failed";
  estimated_usd?: number;
  video_url?: string;
  error?: string;
  duration_sec?: number;
}

export interface GenerationResult {
  status: "posted" | "failed";
  video_url?: string;
  post_id?: string;
  error?: string;
  log: GenerationLogEntry[];
}

// ── Pure helpers ────────────────────────────────────────────────────

/** Visual treatment per status — label + Tailwind chip classes. */
export interface StatusMeta {
  label: string;
  classes: string;
}

const STATUS_META: Record<AdBriefStatus, StatusMeta> = {
  draft: { label: "Draft", classes: "text-gray-300 bg-gray-500/10 border-gray-500/30" },
  generating: { label: "Generating", classes: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30" },
  ready: { label: "Ready", classes: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30" },
  posted: { label: "Posted", classes: "text-green-300 bg-green-500/10 border-green-500/30" },
  failed: { label: "Failed", classes: "text-red-300 bg-red-500/10 border-red-500/30" },
  archived: { label: "Archived", classes: "text-gray-500 bg-gray-700/20 border-gray-700/40" },
};

export function statusMeta(status: AdBriefStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.draft;
}

/** Parse the CSV `target_socials` field into a trimmed, de-duped array. */
export function parseTargetSocials(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of csv.split(",")) {
    const v = raw.trim().toLowerCase();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/** Inverse of parseTargetSocials — array → canonical CSV (or null). */
export function formatTargetSocials(socials: string[]): string | null {
  const cleaned = parseTargetSocials(socials.join(","));
  return cleaned.length ? cleaned.join(",") : null;
}

/** Safely parse the JSON `generation_log` column. Never throws. */
export function parseGenerationLog(raw: string | null | undefined): GenerationLogEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GenerationLogEntry[]) : [];
  } catch {
    return [];
  }
}

/** Sum the estimated cost across a generation log's steps. */
export function totalEstimatedUsd(log: GenerationLogEntry[]): number {
  return log.reduce((sum, e) => sum + (typeof e.estimated_usd === "number" ? e.estimated_usd : 0), 0);
}

/** Human-readable byte size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** True if the brief is mid-generation (UI should poll / lock controls). */
export function isGenerating(status: AdBriefStatus): boolean {
  return status === "generating";
}
