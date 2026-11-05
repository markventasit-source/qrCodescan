import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BOT = /bot|crawler|spider|preview|facebookexternalhit|slurp|headless|curl|wget/i;

function deviceOf(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const qr = await prisma.qrCode.findUnique({ where: { slug: params.slug } });
  if (!qr) return new NextResponse("QR code not found", { status: 404 });

  const res = NextResponse.redirect(qr.targetUrl, 302);
  res.headers.set("Cache-Control", "no-store");

  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return res; // don't count link previews / crawlers

  let visitorId = req.cookies.get("qr_vid")?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    res.cookies.set("qr_vid", visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  try {
    const seen = await prisma.scan.findFirst({
      where: { qrCodeId: qr.id, visitorId },
      select: { id: true },
    });

    await Promise.all([
      prisma.scan.create({
        data: {
          qrCodeId: qr.id,
          visitorId,
          device: deviceOf(ua),
          userAgent: ua.slice(0, 300),
          referer: req.headers.get("referer")?.slice(0, 300) ?? null,
        },
      }),
      prisma.qrCode.update({
        where: { id: qr.id },
        data: {
          totalScans: { increment: 1 },
          ...(seen ? {} : { uniqueVisitors: { increment: 1 } }),
          lastScannedAt: new Date(),
        },
      }),
    ]);
  } catch (e) {
    console.error("scan log failed", e); // never block the redirect
  }

  return res;
}
