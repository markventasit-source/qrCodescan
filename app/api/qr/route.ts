import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.qrCode.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/qr database error:", error);
    return NextResponse.json(
      {
        error: "Database error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const targetUrl = String(body.targetUrl ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try {
    const u = new URL(targetUrl);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Enter a valid http(s) URL" }, { status: 400 });
  }

  for (let i = 0; i < 5; i++) {
    const slug = randomBytes(5).toString("base64url").replace(/[-_]/g, "x").slice(0, 7);
    try {
      const item = await prisma.qrCode.create({ data: { name, targetUrl, slug } });
      return NextResponse.json({ item }, { status: 201 });
    } catch {
      /* slug collision, retry */
    }
  }
  return NextResponse.json({ error: "Could not create QR code" }, { status: 500 });
}
