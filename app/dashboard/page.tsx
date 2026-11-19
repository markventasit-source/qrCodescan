"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

/* ───────── types & helpers ───────── */

type Qr = {
  id: string;
  name: string;
  slug: string;
  targetUrl: string;
  totalScans: number;
  uniqueVisitors: number;
  lastScannedAt: string | null;
  createdAt: string;
};

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
const shortUrl = (slug: string) => `${baseUrl()}/q/${slug}`;

function prettyUrl(u: string) {
  try {
    const x = new URL(u);
    return x.host + (x.pathname === "/" ? "" : x.pathname) + x.search;
  } catch {
    return u;
  }
}

function timeAgo(iso: string | null) {
  if (!iso) return "No scans yet";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

const fileName = (q: Qr) =>
  q.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || q.slug;

async function downloadPng(q: Qr) {
  const url = await QRCode.toDataURL(shortUrl(q.slug), { width: 1024, margin: 2 });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName(q)}.png`;
  a.click();
}

async function downloadSvg(q: Qr) {
  const svg = await QRCode.toString(shortUrl(q.slug), { type: "svg", margin: 2 });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName(q)}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───────── icons ───────── */

const ICONS = {
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  copy: "M9 9h10v10H9zM5 15V5h10",
  download: "M12 4v12m0 0l-4-4m4 4l4-4M5 20h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  x: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  external: "M14 4h6v6M20 4l-9 9M18 14v5H5V6h5",
} as const;
type IconName = keyof typeof ICONS;

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ───────── small components ───────── */

function QrImage({ value, size, className = "" }: { value: string; size: number; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1 }).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [value, size]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" width={size} height={size} className={className} /> : (
    <div style={{ width: size, height: size }} className={`animate-pulse bg-line ${className}`} />
  );
}

function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEsc(onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="fade-in absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pop-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-paper">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink transition hover:bg-paper";

type Param = { key: string; value: string };

function buildUrl(base: string, params: Param[]): string {
  const filled = params.filter((p) => p.key.trim());
  if (!filled.length) return base;
  try {
    const u = new URL(base);
    filled.forEach((p) => u.searchParams.set(p.key.trim(), p.value));
    return u.toString();
  } catch {
    // base URL isn't parseable yet — append manually
    const qs = filled.map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`).join("&");
    return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
  }
}

function QrForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; url: string };
  submitLabel: string;
  onSubmit: (name: string, url: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [params, setParams] = useState<Param[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function addParam() {
    setParams((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateParam(index: number, field: "key" | "value", val: string) {
    setParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  }

  function removeParam(index: number) {
    setParams((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const clean = url.trim();
    const full = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    const finalUrl = buildUrl(full, params);
    const err = await onSubmit(name.trim(), finalUrl);
    setBusy(false);
    if (err) setError(err);
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  const previewUrl = (() => {
    const clean = url.trim();
    if (!clean) return null;
    const full = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    const result = buildUrl(full, params);
    return result !== full ? result : null;
  })();

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Name</span>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Brochure, October campaign"
          className={input}
        />
        <span className="mt-1 block text-xs text-muted">Only you see this. It helps you tell QR codes apart.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Destination page</span>
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourwebsite.com/landing-page"
          inputMode="url"
          className={input}
        />
        <span className="mt-1 block text-xs text-muted">People land here after they scan.</span>
      </label>

      {params.length > 0 && (
        <div className="space-y-2">
          <span className="block text-sm font-medium">URL parameters</span>
          {params.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p.key}
                onChange={(e) => updateParam(i, "key", e.target.value)}
                placeholder="key"
                className="w-[38%] rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <span className="shrink-0 text-xs text-muted">=</span>
              <input
                value={p.value}
                onChange={(e) => updateParam(i, "value", e.target.value)}
                placeholder="value"
                className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => removeParam(i)}
                aria-label="Remove parameter"
                className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <p className="break-all rounded-lg bg-paper px-3 py-2 text-xs text-muted">
          <span className="font-medium text-ink">Final URL: </span>{previewUrl}
        </p>
      )}

      <button
        type="button"
        onClick={addParam}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <Icon name="plus" className="h-3.5 w-3.5" />
        Add parameter
      </button>

      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
        <button disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Drawer({
  qr,
  onClose,
  onCopy,
  onEdit,
  onDelete,
}: {
  qr: Qr;
  onClose: () => void;
  onCopy: (text: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  useEsc(onClose);
  const link = shortUrl(qr.slug);
  return (
    <div className="fixed inset-0 z-40">
      <div className="fade-in absolute inset-0 bg-ink/30" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={qr.name}
        className="drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{qr.name}</h2>
            <p className="text-sm text-muted">Created {new Date(qr.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-paper">
            <Icon name="x" />
          </button>
        </header>

        <div className="space-y-6 p-5">
          <div className="grid place-items-center rounded-2xl bg-brand-dark p-8">
            <div className="rounded-xl bg-white p-3">
              <QrImage value={link} size={220} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <div className="bg-white p-4">
              <div className="text-2xl font-semibold tabular-nums">{qr.totalScans.toLocaleString()}</div>
              <div className="text-xs text-muted">Total scans</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-2xl font-semibold tabular-nums">{qr.uniqueVisitors.toLocaleString()}</div>
              <div className="text-xs text-muted">Unique visitors</div>
            </div>
            <div className="col-span-2 bg-white px-4 py-3 text-sm">
              <span className="text-muted">Last scan: </span>
              {timeAgo(qr.lastScannedAt)}
            </div>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="mb-1 text-xs font-medium text-muted">Tracking link</dt>
              <dd className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-paper px-3 py-2">{link}</code>
                <button onClick={() => onCopy(link)} className={btnGhost} aria-label="Copy tracking link">
                  <Icon name="copy" />
                  Copy
                </button>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-medium text-muted">Sends people to</dt>
              <dd>
                <a
                  href={qr.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-brand hover:underline"
                >
                  <span className="truncate">{prettyUrl(qr.targetUrl)}</span>
                  <Icon name="external" className="h-3.5 w-3.5 shrink-0" />
                </a>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadPng(qr)} className={btnPrimary}>
              <Icon name="download" />
              Download PNG
            </button>
            <button onClick={() => downloadSvg(qr)} className={btnGhost}>
              <Icon name="download" />
              SVG
            </button>
          </div>
        </div>

        <footer className="mt-auto flex gap-2 border-t border-line p-5">
          <button onClick={onEdit} className={btnGhost}>
            <Icon name="edit" />
            Edit
          </button>
          <button onClick={onDelete} className={`${btnGhost} text-danger hover:bg-danger/5`}>
            <Icon name="trash" />
            Delete
          </button>
        </footer>
      </aside>
    </div>
  );
}

/* ───────── page ───────── */

type FormState = { type: "create" } | { type: "edit"; qr: Qr } | null;
const ROW_GRID = "md:grid-cols-[minmax(0,1fr)_96px_96px_130px_40px]";

export default function Dashboard() {
  const [items, setItems] = useState<Qr[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "scans">("new");
  const [form, setForm] = useState<FormState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Qr | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch("/api/qr", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setItems((await r.json()).items);
      setLoadError(false);
      setUpdatedAt(new Date());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    notify("Link copied");
  }

  async function createQr(name: string, targetUrl: string): Promise<string | null> {
    const r = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetUrl }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return j.error || "Could not create the QR code. Try again.";
    await load();
    setForm(null);
    setSelectedId(j.item.id);
    notify("QR code created");
    return null;
  }

  async function updateQr(id: string, name: string, targetUrl: string): Promise<string | null> {
    const r = await fetch(`/api/qr/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetUrl }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return j.error || "Could not save changes. Try again.";
    await load();
    setForm(null);
    notify("Changes saved");
    return null;
  }

  async function deleteQr(q: Qr) {
    await fetch(`/api/qr/${q.id}`, { method: "DELETE" });
    setToDelete(null);
    setSelectedId(null);
    await load();
    notify("QR code deleted");
  }

  const totals = useMemo(() => {
    const top = items.reduce<Qr | null>((a, q) => (q.totalScans > (a?.totalScans ?? 0) ? q : a), null);
    return {
      scans: items.reduce((s, q) => s + q.totalScans, 0),
      unique: items.reduce((s, q) => s + q.uniqueVisitors, 0),
      top,
    };
  }, [items]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = term
      ? items.filter((q) => [q.name, q.targetUrl, q.slug].some((v) => v.toLowerCase().includes(term)))
      : [...items];
    if (sort === "scans") list.sort((a, b) => b.totalScans - a.totalScans);
    return list;
  }, [items, query, sort]);

  const selected = items.find((q) => q.id === selectedId) ?? null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-dark">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden="true">
                <path d="M3 3h8v8H3zM5 5v4h4V5zM13 3h8v8h-8zM15 5v4h4V5zM3 13h8v8H3zM5 15v4h4v-4zM13 13h3v3h-3zM18 13h3v3h-3zM13 18h3v3h-3zM18 18h3v3h-3z" />
              </svg>
            </span>
            <span className="text-base font-semibold">QR Tracker</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            {updatedAt && (
              <span className="hidden sm:inline">
                Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={() => load(true)} aria-label="Refresh" className="rounded-md p-2 hover:bg-paper">
              <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">QR codes</h1>
            <p className="mt-1 text-sm text-muted">See how many people open your pages from each QR code.</p>
          </div>
          <button onClick={() => setForm({ type: "create" })} className={btnPrimary}>
            <Icon name="plus" />
            New QR code
          </button>
        </div>

        <section
          aria-label="Summary"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4"
        >
          <Stat label="QR codes" value={loading ? "–" : items.length.toLocaleString()} />
          <Stat label="Total scans" value={loading ? "–" : totals.scans.toLocaleString()} />
          <Stat label="Unique visitors" value={loading ? "–" : totals.unique.toLocaleString()} />
          <div className="min-w-0 bg-white p-5">
            <div className="truncate text-lg font-semibold leading-9">
              {totals.top ? totals.top.name : "–"}
            </div>
            <div className="text-xs text-muted">
              {totals.top ? `Most scanned, ${totals.top.totalScans.toLocaleString()} scans` : "Most scanned"}
            </div>
          </div>
        </section>

        {loadError && (
          <div role="alert" className="flex items-center justify-between rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            <span>Could not load your QR codes. Check your connection and database settings.</span>
            <button onClick={() => load(true)} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && items.length === 0 && !loadError ? (
          <section className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">Create your first QR code</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Each QR code gets its own tracking link. Every scan is counted, then people go straight to your page.
            </p>
            <button onClick={() => setForm({ type: "create" })} className={`${btnPrimary} mt-6`}>
              <Icon name="plus" />
              New QR code
            </button>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
              <div className="relative min-w-[200px] flex-1">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or page"
                  aria-label="Search QR codes"
                  className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "new" | "scans")}
                aria-label="Sort"
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="new">Newest first</option>
                <option value="scans">Most scans</option>
              </select>
            </div>

            <div className={`hidden border-b border-line bg-paper/60 px-4 py-2.5 text-xs font-medium text-muted md:grid ${ROW_GRID} md:gap-4`}>
              <span>QR code</span>
              <span className="text-right">Scans</span>
              <span className="text-right">Unique</span>
              <span>Last scan</span>
              <span />
            </div>

            {loading ? (
              <ul>
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-4 border-b border-line p-4 last:border-0">
                    <div className="h-11 w-11 animate-pulse rounded-lg bg-line" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : visible.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted">
                No QR codes match “{query}”. Try a different name or page.
              </p>
            ) : (
              <ul>
                {visible.map((q) => (
                  <li
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`grid cursor-pointer items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 transition last:border-0 hover:bg-paper/70 ${ROW_GRID}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <QrImage
                        value={shortUrl(q.slug)}
                        size={44}
                        className="shrink-0 rounded-lg border border-line bg-white p-0.5"
                      />
                      <div className="min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(q.id);
                          }}
                          className="block max-w-full truncate text-left text-sm font-semibold hover:text-brand"
                        >
                          {q.name}
                        </button>
                        <div className="truncate text-xs text-muted">{prettyUrl(q.targetUrl)}</div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-muted md:hidden">
                      <span>
                        <b className="text-sm text-ink">{q.totalScans}</b> scans
                      </span>
                      <span>
                        <b className="text-sm text-ink">{q.uniqueVisitors}</b> unique
                      </span>
                      <span>{timeAgo(q.lastScannedAt)}</span>
                    </div>

                    <span className="hidden text-right text-sm font-semibold tabular-nums md:block">
                      {q.totalScans.toLocaleString()}
                    </span>
                    <span className="hidden text-right text-sm tabular-nums md:block">
                      {q.uniqueVisitors.toLocaleString()}
                    </span>
                    <span className="hidden text-sm text-muted md:block">{timeAgo(q.lastScannedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(shortUrl(q.slug));
                      }}
                      aria-label={`Copy tracking link for ${q.name}`}
                      className="hidden rounded-md p-2 text-muted hover:bg-paper hover:text-ink md:block"
                    >
                      <Icon name="copy" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {selected && (
        <Drawer
          qr={selected}
          onClose={() => setSelectedId(null)}
          onCopy={copy}
          onEdit={() => setForm({ type: "edit", qr: selected })}
          onDelete={() => setToDelete(selected)}
        />
      )}

      {form?.type === "create" && (
        <Modal title="New QR code" onClose={() => setForm(null)}>
          <QrForm submitLabel="Create QR code" onSubmit={createQr} onCancel={() => setForm(null)} />
        </Modal>
      )}

      {form?.type === "edit" && (
        <Modal title="Edit QR code" onClose={() => setForm(null)}>
          <QrForm
            initial={{ name: form.qr.name, url: form.qr.targetUrl }}
            submitLabel="Save changes"
            onSubmit={(n, u) => updateQr(form.qr.id, n, u)}
            onCancel={() => setForm(null)}
          />
          <p className="mt-4 text-xs text-muted">
            The printed QR code stays the same. Only the page people land on changes.
          </p>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete QR code?" onClose={() => setToDelete(null)}>
          <p className="text-sm text-muted">
            “{toDelete.name}” and its {toDelete.totalScans.toLocaleString()} recorded scans will be removed. Printed
            copies of this QR code will stop working.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setToDelete(null)} className={btnGhost}>
              Cancel
            </button>
            <button
              onClick={() => deleteQr(toDelete)}
              className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Delete QR code
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div
          role="status"
          className="toast-in fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <div className="text-3xl font-semibold leading-9 tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}