import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: { name?: string; targetUrl?: string } = {};

  if (body.name) data.name = String(body.name).trim();
  if (body.targetUrl) {
    try {
      const u = new URL(String(body.targetUrl).trim());
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
      data.targetUrl = u.toString();
    } catch {
      return NextResponse.json({ error: "Enter a valid http(s) URL" }, { status: 400 });
    }
  }

  try {
    const item = await prisma.qrCode.update({ where: { id: params.id }, data });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.scan.deleteMany({ where: { qrCodeId: params.id } });
    await prisma.qrCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
