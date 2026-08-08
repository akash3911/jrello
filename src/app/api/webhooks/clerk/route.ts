import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // If secret is set, verify with Svix
  if (WEBHOOK_SECRET) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new NextResponse("Missing Svix headers", { status: 400 });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    try {
      wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new NextResponse("Error verifying webhook", { status: 400 });
    }
  }

  const eventType = payload.type;
  const { id: clerkId, email_addresses, first_name, last_name, image_url } = payload.data || {};

  const primaryEmail =
    email_addresses?.[0]?.email_address || `${clerkId}@user.clerk`;
  const name = [first_name, last_name].filter(Boolean).join(" ") || null;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      await prisma.user.upsert({
        where: { clerkId },
        update: {
          email: primaryEmail,
          name,
          avatarUrl: image_url || null,
        },
        create: {
          clerkId,
          email: primaryEmail,
          name,
          avatarUrl: image_url || null,
        },
      });
    } else if (eventType === "user.deleted") {
      await prisma.user.updateMany({
        where: { clerkId },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, eventType });
  } catch (error) {
    console.error("Failed to process Clerk webhook event:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
