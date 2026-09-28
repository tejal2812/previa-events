import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { getSupabaseAdmin, VERIFICATION_BUCKET } from "../../../../../../lib/supabase-admin";
import { VERIFICATION_STATUSES } from "../../../../../../lib/verification";

function requireAdmin(session) {
  return session?.user?.role === "ADMIN";
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true, phoneVerified: true, emailVerified: true } },
        city: true,
        area: true,
        categories: { include: { category: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        verificationAudits: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } },
      },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    const supabase = getSupabaseAdmin();
    const documents = await Promise.all(vendor.verificationDocuments.map(async (document) => {
      const { data, error } = await supabase.storage.from(VERIFICATION_BUCKET).createSignedUrl(document.storagePath, 300);
      return { ...document, signedUrl: error ? null : data.signedUrl };
    }));
    return NextResponse.json({ vendor: { ...vendor, documents, panNumber: vendor.panNumber, gstin: vendor.gstin, businessRegistration: vendor.businessRegistration } });
  } catch (error) {
    console.error("Admin verification detail error:", error);
    return NextResponse.json({ error: "Unable to load verification details." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const nextStatus = typeof body.status === "string" ? body.status : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
    const action = typeof body.action === "string" ? body.action : nextStatus;
    if (![...VERIFICATION_STATUSES, "REQUEST_INFORMATION"].includes(action)) return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
    if (["REJECTED", "SUSPENDED", "REQUEST_INFORMATION"].includes(action) && !reason) return NextResponse.json({ error: "A reason is required for this action." }, { status: 400 });

    const current = await prisma.vendorProfile.findUnique({ where: { id }, select: { verificationStatus: true, userId: true, businessName: true } });
    if (!current) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    const resolvedStatus = action === "REQUEST_INFORMATION" ? "UNDER_REVIEW" : action;
    const isVerified = resolvedStatus === "VERIFIED";
    const updated = await prisma.$transaction(async (transaction) => {
      const vendor = await transaction.vendorProfile.update({ where: { id }, data: { verificationStatus: resolvedStatus, verificationReason: reason || null, verificationReviewedAt: new Date(), verificationReviewedBy: session.user.id, isVerified, status: isVerified ? "APPROVED" : resolvedStatus === "SUSPENDED" ? "SUSPENDED" : resolvedStatus === "REJECTED" ? "REJECTED" : "PENDING" } });
      await transaction.vendorVerificationAudit.create({ data: { vendorId: id, adminId: session.user.id, action, fromStatus: current.verificationStatus, toStatus: resolvedStatus, reason: reason || null } });
      const messages = {
        UNDER_REVIEW: ["VENDOR_UNDER_REVIEW", "Application under review", "Your PREVIA verification application is being reviewed."],
        VERIFIED: ["VENDOR_VERIFIED", "Verified by PREVIA", "Your business verification is complete. This confirms the submitted identity and business documents, not quality or reputation."],
        REJECTED: ["VENDOR_REJECTED", "Verification update", `Your verification application needs changes. ${reason}`],
        SUSPENDED: ["VENDOR_SUSPENDED", "Verification suspended", `Your verification has been suspended. ${reason}`],
      };
      const [type, title, bodyText] = messages[resolvedStatus] || ["VENDOR_INFORMATION_REQUESTED", "More information requested", reason];
      await transaction.notification.create({ data: { userId: current.userId, type, title, body: bodyText, link: "/vendor/dashboard" } });
      return vendor;
    });
    return NextResponse.json({ success: true, vendor: updated });
  } catch (error) {
    console.error("Admin verification action error:", error);
    return NextResponse.json({ error: "Unable to update verification status." }, { status: 500 });
  }
}
