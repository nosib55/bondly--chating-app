import { NextResponse } from "next/server";
import { connectDB } from "@/server/config/db";
import Message from "@/server/modules/message/message.model";
import User from "@/server/modules/user/user.model";

/**
 * GET /api/conversations?uid=<firebaseUid>
 * Returns users who have exchanged at least one message with the current user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Resolve the current user's MongoDB ObjectId
    const me = await User.findOne({ firebaseUid: uid });
    if (!me) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Find all messages where the current user is sender OR receiver
    const messages = await Message.find({
      $or: [{ sender: me._id }, { receiver: me._id }],
    }).select("sender receiver createdAt").sort({ createdAt: -1 });

    // Collect unique peer IDs (the other party in each message)
    const peerIdSet = new Set<string>();
    for (const msg of messages) {
      const senderId = msg.sender.toString();
      const receiverId = msg.receiver.toString();
      const meId = me._id.toString();
      if (senderId !== meId) peerIdSet.add(senderId);
      if (receiverId !== meId) peerIdSet.add(receiverId);
    }

    if (peerIdSet.size === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // Fetch the peer user documents
    const peerUsers = await User.find({ _id: { $in: Array.from(peerIdSet) } });

    return NextResponse.json({ success: true, users: peerUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
