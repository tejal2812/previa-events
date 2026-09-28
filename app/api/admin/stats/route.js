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

    const [
      totalCustomers,
      totalVendors,
      verifiedVendors,
      pendingVendors,
      totalEnquiries,
      totalQuotations,
      totalBookings,
      bookingAmounts,
      recentEnquiries,
      recentVendors,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "VENDOR" } }),
      prisma.vendorProfile.count({ where: { isVerified: true } }),
      prisma.vendorProfile.count({ where: { status: "PENDING" } }),
      prisma.enquiry.count(),
      prisma.quotation.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { bookingAmount: true, commissionAmount: true } }),
      prisma.enquiry.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          vendor: { select: { businessName: true } },
        },
      }),
      prisma.vendorProfile.findMany({
        where: { status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { categories: { include: { category: true }, take: 1 }, city: true },
      }),
    ]);

    const grossValue = bookingAmounts._sum.bookingAmount || 0;
    const totalCommission = bookingAmounts._sum.commissionAmount || 0;

    return NextResponse.json({
      stats: {
        totalCustomers,
        totalVendors,
        verifiedVendors,
        pendingVendors,
        totalEnquiries,
        totalQuotations,
        totalBookings,
        grossValue,
        totalCommission,
      },
      recentEnquiries,
      recentVendors,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}
