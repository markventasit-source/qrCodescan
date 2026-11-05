"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

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

const shortUrl = (slug: string) =>
  `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/q/${slug}`;

function QrImage({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: 512, margin: 2 }).then(setSrc);
  }, [value]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR code" className="h-32 w-32 rounded-lg bg-white p-1" />
  ) : (
    <div className="h-32 w-32 animate-pulse rounded-lg bg-gray-200" />
  );
}

async function downloadPng(value: string, filename: string) {
  const url = await QRCode.toDataURL(value, { width: 1024, margin: 2 });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
}

export default function Dashboard() {
  const [items, setItems] = useState<Qr[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/qr", { cache: "no-store" });
    if (r.ok) setItems((await r.json()).items);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const r = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetUrl: url }),
    });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) return setError(j.error || "Something went wrong");
    setName("");
    setUrl("");
    load();
  }

  async function editUrl(q: Qr) {
    const next = window.prompt("New destination URL", q.targetUrl);
    if (!next || next === q.targetUrl) return;
    const r = await fetch(`/api/qr/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: next }),
    });
    if (!r.ok) alert((await r.json()).error || "Failed");
    load();
  }

  async function remove(q: Qr) {
    if (!window.confirm(`Delete "${q.name}" and all its scan data?`)) return;
    await fetch(`/api/qr/${q.id}`, { method: "DELETE" });
    load();
  }

  const totalScans = items.reduce((s, q) => s + q.totalScans, 0);
  const totalUnique = items.reduce((s, q) => s + q.uniqueVisitors, 0);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">QR Code Tracker</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="QR codes" value={items.length} />
        <Stat label="Total scans" value={totalScans} />
        <Stat label="Unique visitors" value={totalUnique} />
      </section>

      <form onSubmit={create} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_2fr_auto]">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Flyer – Oct campaign)"
          className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
        />
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourwebsite.com/landing-page"
          className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Generate QR"}
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No QR codes yet. Create your first one above.</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {items.map((q) => (
            <article key={q.id} className="flex gap-4 rounded-xl border bg-white p-4">
              <QrImage value={shortUrl(q.slug)} />
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="truncate font-semibold">{q.name}</h2>
                <p className="truncate text-sm text-gray-500" title={q.targetUrl}>
                  → {q.targetUrl}
                </p>
                <div className="flex gap-6">
                  <div>
                    <div className="text-2xl font-bold">{q.totalScans}</div>
                    <div className="text-xs text-gray-500">scans</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{q.uniqueVisitors}</div>
                    <div className="text-xs text-gray-500">unique</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Last scan: {q.lastScannedAt ? new Date(q.lastScannedAt).toLocaleString() : "never"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-sm">
                  <button onClick={() => downloadPng(shortUrl(q.slug), q.slug)} className="rounded border px-2 py-1 hover:bg-gray-50">
                    Download PNG
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(shortUrl(q.slug))}
                    className="rounded border px-2 py-1 hover:bg-gray-50"
                  >
                    Copy link
                  </button>
                  <button onClick={() => editUrl(q)} className="rounded border px-2 py-1 hover:bg-gray-50">
                    Edit URL
                  </button>
                  <button onClick={() => remove(q)} className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
