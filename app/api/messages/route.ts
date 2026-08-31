import { NextResponse } from "next/server";
import { connectDB } from "@/server/config/db";
import Message from "@/server/modules/message/message.model";
import User from "@/server/modules/user/user.model";

/**
 * DELETE /api/messages?uid=<firebaseUid>&mode=all|12h
 * - mode=all: Deletes ALL messages where user is either sender or receiver (deletes for both sides!)
 * - mode=12h: Deletes messages older than 12 hours for this user (both sides)
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const mode = searchParams.get("mode") || "all";

    if (!uid) {
      return NextResponse.json({ success: false, message: "Unauthorized: Missing uid" }, { status: 401 });
    }

    await connectDB();

    const me = await User.findOne({ firebaseUid: uid });
    if (!me) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let filter: any = {
      $or: [{ sender: me._id }, { receiver: me._id }],
    };

    if (mode === "12h") {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      filter.createdAt = { $lt: twelveHoursAgo };
    }

    const result = await Message.deleteMany(filter);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message:
        mode === "12h"
          ? `Deleted ${result.deletedCount} messages older than 12 hours for both sides.`
          : `All chat history (${result.deletedCount} messages) permanently deleted for both sides.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/messages/cleanup
 * Checks and cleans up messages older than 12 hours if autoDelete12h is enabled for the user
 */
export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const me = (await User.findOne({ firebaseUid: uid })) as any;
    if (!me) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (me.autoDelete12h) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const result = await Message.deleteMany({
        $or: [{ sender: me._id }, { receiver: me._id }],
        createdAt: { $lt: twelveHoursAgo },
      });

      return NextResponse.json({
        success: true,
        autoDeleted: true,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json({ success: true, autoDeleted: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
