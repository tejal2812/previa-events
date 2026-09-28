import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const vendors = await prisma.vendorProfile.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        categories: { include: { category: true }, take: 1 },
        city: true,
        area: true,
        verificationDocuments: { select: { id: true, documentType: true, status: true, createdAt: true } },
        _count: { select: { enquiries: true, bookings: true, verificationAudits: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vendors." }, { status: 500 });
  }
}
