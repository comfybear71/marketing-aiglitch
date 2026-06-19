"use client";

/**
 * Contacts — migrated from admin-aiglitch and fixed for marketing.
 *
 * The admin version fetched the list server-side via apiFetch to
 * localhost, which doesn't proxy to api.aiglitch.app in production —
 * that's the "Couldn't load contacts" bug. Here the client fetches the
 * list itself (same-origin /api/admin/contacts, proxied correctly) and
 * re-fetches after every create / edit / delete so the table stays live.
 */

import { useCallback, useEffect, useState, useTransition } from "react";

export interface Contact {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  tags: string[];
  assigned_persona_id: string | null;
  notes: string | null;
  last_emailed_at: string | null;
  email_count: number;
  created_at: string;
  updated_at: string;
}

// The backend's GET /api/admin/contacts returns the list at the top
// level — { total, contacts, all_tags } — NOT wrapped in { ok, data }.
// (The admin version assumed the wrapper, which is why it always showed
// "Couldn't load contacts" even on a successful 200.) Errors come back
// as a non-200 with { error }.
interface ContactsResponse {
  total?: number;
  contacts?: Contact[];
  all_tags?: string[];
  error?: string;
}

export function ContactsClient() {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [initialContacts, setContacts] = useState<Contact[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contacts", { credentials: "include" });
      const data = (await res.json()) as ContactsResponse;
      if (!res.ok) {
        setLoadError(data.error || `Couldn't load contacts (${res.status})`);
        return;
      }
      setContacts(data.contacts ?? []);
      setAllTags(data.all_tags ?? []);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onDelete = (c: Contact) => {
    if (!confirm(`Delete ${c.name ?? c.email}? This cannot be undone.`)) return;
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/contacts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id }),
        });
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          setErr(data.error || "Delete failed");
          return;
        }
        await reload();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };

  if (loading) {
    return <div style={{ color: "#6b7280", padding: 24, fontSize: 14 }}>Loading contacts…</div>;
  }
  if (loadError) {
    return (
      <div
        style={{
          background: "rgba(127,29,29,0.2)",
          border: "1px solid rgba(248,113,113,0.4)",
          borderRadius: 8,
          padding: 16,
          color: "#fca5a5",
          fontSize: 14,
        }}
      >
        <strong>Couldn&apos;t load contacts:</strong> {loadError}
      </div>
    );
  }

  return (
    <>
      {err && (
        <div
          style={{
            background: "rgba(127,29,29,0.2)",
            border: "1px solid rgba(248,113,113,0.4)",
            borderRadius: 8,
            padding: 12,
            color: "#fca5a5",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {err}
        </div>
      )}

      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => setShowNew((v) => !v)}
          style={btnPrimary(isPending)}
          disabled={isPending}
        >
          {showNew ? "Cancel" : "+ New contact"}
        </button>
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {initialContacts.length} contact{initialContacts.length === 1 ? "" : "s"}
          {allTags.length > 0 && (
            <>
              {" • tags: "}
              {allTags.map((t) => (
                <span key={t} style={tagPill}>
                  {t}
                </span>
              ))}
            </>
          )}
        </span>
      </div>

      {showNew && (
        <ContactForm
          mode="create"
          onDone={() => {
            setShowNew(false);
            void reload();
          }}
          onError={setErr}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      <div
        style={{
          background: "#111827", // gray-900
          border: "1px solid #1f2937", // gray-800
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {initialContacts.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
            No contacts yet. Click <strong>+ New contact</strong> above.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#1f2937", borderBottom: "1px solid #374151" }}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Company</th>
                <th style={th}>Tags</th>
                <th style={th}>Last emailed</th>
                <th style={{ ...th, width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {initialContacts.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <ContactForm
                        mode="edit"
                        initial={c}
                        onDone={() => {
                          setEditingId(null);
                          void reload();
                        }}
                        onError={setErr}
                        isPending={isPending}
                        startTransition={startTransition}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} style={{ borderBottom: "1px solid #1f2937" }}>
                    <td style={td}>{c.name ?? <em style={{ color: "#9ca3af" }}>—</em>}</td>
                    <td style={td}>
                      <code style={{ fontSize: 13 }}>{c.email}</code>
                    </td>
                    <td style={td}>{c.company ?? <em style={{ color: "#9ca3af" }}>—</em>}</td>
                    <td style={td}>
                      {c.tags.length > 0 ? (
                        c.tags.map((t) => (
                          <span key={t} style={tagPill}>
                            {t}
                          </span>
                        ))
                      ) : (
                        <em style={{ color: "#9ca3af" }}>—</em>
                      )}
                    </td>
                    <td style={{ ...td, color: "#6b7280", fontSize: 12 }}>
                      {c.last_emailed_at
                        ? new Date(c.last_emailed_at).toLocaleDateString()
                        : "never"}
                      {c.email_count > 0 && ` (${c.email_count})`}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button
                        onClick={() => setEditingId(c.id)}
                        disabled={isPending}
                        style={btnGhost(isPending)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        disabled={isPending}
                        style={{
                          ...btnGhost(isPending),
                          borderColor: "rgba(248,113,113,0.4)",
                          color: "#f87171",
                          marginLeft: 4,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── New / Edit form ─────────────────────────────────────────────────────

interface ContactFormProps {
  mode: "create" | "edit";
  initial?: Contact;
  onDone: () => void;
  onError: (err: string | null) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}

function ContactForm({
  mode,
  initial,
  onDone,
  onError,
  isPending,
  startTransition,
}: ContactFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = () => {
    onError(null);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/contacts", {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "create"
              ? { name, email, company, tags, notes }
              : { id: initial!.id, name, email, company, tags, notes }
          ),
        });
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          onError(data.error || "Request failed");
          return;
        }
        onDone();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };

  return (
    <div
      style={{
        background: mode === "create" ? "#111827" : "#0b1220",
        border: mode === "create" ? "1px solid #1f2937" : undefined,
        borderRadius: mode === "create" ? 12 : undefined,
        padding: 16,
        marginBottom: mode === "create" ? 16 : 0,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Andrew Example"
            style={input}
            disabled={isPending}
          />
        </Field>
        <Field label="Email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="andrew@example.com"
            style={input}
            disabled={isPending}
            required
          />
        </Field>
        <Field label="Company">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            style={input}
            disabled={isPending}
          />
        </Field>
        <Field label="Tags (comma-separated)">
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="family, grants"
            style={input}
            disabled={isPending}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes — who they are, how you know them, etc."
          style={{ ...input, minHeight: 60, resize: "vertical" }}
          disabled={isPending}
        />
      </Field>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={submit} disabled={isPending || !email.trim()} style={btnPrimary(isPending)}>
          {isPending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
        <button onClick={onDone} disabled={isPending} style={btnGhost(isPending)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Inline styles ───────────────────────────────────────────────────────

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  color: "#9ca3af", // gray-400
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "top",
  color: "#e5e7eb", // gray-200 — explicit so cells aren't white-on-dark/invisible
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #374151", // gray-700
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#1f2937", // gray-800
  color: "#ffffff",
};
const tagPill: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(168,85,247,0.15)", // purple-500/15
  color: "#d8b4fe", // purple-300
  border: "1px solid rgba(168,85,247,0.3)",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  marginRight: 4,
  fontWeight: 500,
};
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  border: "none",
  borderRadius: 8,
  background: disabled ? "#4b5563" : "#9333ea", // gray-600 / purple-600
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
});
const btnGhost = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  border: "1px solid #374151", // gray-700
  borderRadius: 8,
  background: "#1f2937", // gray-800
  color: "#e5e7eb",
  fontSize: 14,
  fontWeight: 500,
  cursor: disabled ? "not-allowed" : "pointer",
});
