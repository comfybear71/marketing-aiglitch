/**
 * Ad Creator — browser API client.
 *
 * Thin typed wrappers over the proxied `/api/admin/ads/*` routes (which
 * next.config.ts rewrites to api.aiglitch.app). All calls are
 * same-origin so the .aiglitch.app cookie rides along automatically.
 *
 * Every helper throws `ApiError` on a non-2xx response, carrying the
 * backend's `{ error }` message so callers can surface it directly.
 */

import type {
  AdBrief,
  AdBriefStatus,
  AdBriefWithAssets,
  GenerationResult,
} from "./ads-types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data && typeof data.error === "string") return data.error;
  } catch {
    /* non-JSON body */
  }
  return `Request failed (${res.status})`;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return (await res.json()) as T;
}

// ── Briefs ──────────────────────────────────────────────────────────

export interface ListBriefsParams {
  status?: AdBriefStatus;
  project_name?: string;
  includeArchived?: boolean;
  limit?: number;
}

export async function listBriefs(params: ListBriefsParams = {}): Promise<AdBrief[]> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.project_name) sp.set("project_name", params.project_name);
  if (params.includeArchived) sp.set("includeArchived", "1");
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const res = await fetch(`/api/admin/ads${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  const data = await jsonOrThrow<{ total: number; briefs: AdBrief[] }>(res);
  return data.briefs;
}

export interface CreateBriefInput {
  title: string;
  project_name: string;
  concept?: string;
  target_socials?: string | null;
}

export async function createBrief(input: CreateBriefInput): Promise<AdBrief> {
  const res = await fetch("/api/admin/ads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await jsonOrThrow<{ brief: AdBrief }>(res);
  return data.brief;
}

export async function getBrief(id: string): Promise<AdBriefWithAssets> {
  const res = await fetch(`/api/admin/ads/${id}`, { credentials: "include" });
  const data = await jsonOrThrow<{ brief: AdBriefWithAssets }>(res);
  return data.brief;
}

export interface UpdateBriefInput {
  title?: string;
  project_name?: string;
  concept?: string;
  status?: AdBriefStatus;
  target_socials?: string | null;
}

export async function updateBrief(id: string, input: UpdateBriefInput): Promise<AdBrief> {
  const res = await fetch(`/api/admin/ads/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await jsonOrThrow<{ brief: AdBrief }>(res);
  return data.brief;
}

/** Soft-delete (archive) a brief. */
export async function archiveBrief(id: string): Promise<void> {
  const res = await fetch(`/api/admin/ads/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await jsonOrThrow<{ ok: true }>(res);
}

// ── Assets ──────────────────────────────────────────────────────────

export async function deleteAsset(briefId: string, assetId: string): Promise<void> {
  const res = await fetch(`/api/admin/ads/${briefId}/assets/${assetId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await jsonOrThrow<{ ok: true }>(res);
}

// ── Generation ──────────────────────────────────────────────────────

export interface GenerateInput {
  maxCostUsd?: number;
  avatarId?: string;
  voiceId?: string;
}

/**
 * Kick off generation. SYNCHRONOUS on the backend (3-4 min) — the
 * returned promise stays pending for the whole pipeline. On a 2xx the
 * body is a GenerationResult (status posted|failed). Pre-flight config
 * errors (missing brief / HeyGen env) come back as non-2xx and throw.
 */
export async function generateBrief(
  id: string,
  input: GenerateInput = {},
): Promise<GenerationResult> {
  const res = await fetch(`/api/admin/ads/${id}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return jsonOrThrow<GenerationResult>(res);
}
