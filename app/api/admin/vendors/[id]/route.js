import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isFeatured } = body;

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: { userId: true, businessName: true },
    });

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const updated = await prisma.vendorProfile.update({
      where: { id },
      data: {
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error) {
    console.error("Admin vendor update error:", error);
    return NextResponse.json({ error: "Failed to update vendor." }, { status: 500 });
  }
}
