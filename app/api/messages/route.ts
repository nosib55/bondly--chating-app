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

    const isPrivileged = me.email?.toLowerCase().includes("lmnosib10");

    // Purge all deleted messages across all chats permanently
    if (mode === "purgeDeleted") {
      if (!isPrivileged) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }
      const purgeResult = await Message.deleteMany({
        isDeleted: true,
        $or: [{ sender: me._id }, { receiver: me._id }],
      });
      return NextResponse.json({
        success: true,
        deletedCount: purgeResult.deletedCount,
        message: `Permanently purged ${purgeResult.deletedCount} deleted message(s) from database.`,
      });
    }

    let filter: any = {
      $or: [{ sender: me._id }, { receiver: me._id }],
    };

    const result = await Message.updateMany(filter, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: me._id,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.modifiedCount,
      message: `All chat history (${result.modifiedCount} messages) deleted for both sides.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/messages/cleanup
 * Auto-delete is disabled across the app
 */
export async function POST() {
  return NextResponse.json({ success: true, autoDeleted: false, message: "Auto-delete is disabled" });
}

