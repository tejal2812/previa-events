import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { requiredString } from "../../../../lib/validation";

export async function POST(req) {
  try {
    const body = await req.json();
    const name = requiredString(body.name, 100);
    const email = requiredString(body.email, 254)?.toLowerCase();
    const password = typeof body.password === "string" ? body.password : null;
    const phone = requiredString(body.phone, 30);
    const role = body.role;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be 8 to 128 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedRole = ["VENDOR", "ORGANIZER"].includes(role) ? role : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: normalizedRole,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Create notification for admin if vendor
    if (normalizedRole === "VENDOR" || normalizedRole === "ORGANIZER") {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "NEW_VENDOR_REGISTRATION",
            title: "New Vendor Registration",
            body: `${name} has registered as a vendor and is awaiting onboarding.`,
            link: "/admin/vendors",
          },
        });
      }
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
