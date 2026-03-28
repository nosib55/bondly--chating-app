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
    const me = (await User.findOne({ firebaseUid: uid })) as any;
    if (!me) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: me._id }, { receiver: me._id }],
    }).sort({ createdAt: -1 });

    // Collect partners and their last message/unread counts
    const partnerMap = new Map<string, any>();
    const meIdStr = me._id.toString();

    for (const msg of messages) {
      const senderId = msg.sender.toString();
      const receiverId = msg.receiver.toString();
      const partnerId = senderId === meIdStr ? receiverId : senderId;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          lastMessage: msg.text || (msg.image ? "Sent a photo" : ""),
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      }

      // If I am the receiver and message is unread, increment count
      if (receiverId === meIdStr && !msg.read) {
        partnerMap.get(partnerId).unreadCount += 1;
      }
    }

    if (partnerMap.size === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // Fetch the peer user documents
    const peerUsers = await User.find({ _id: { $in: Array.from(partnerMap.keys()) } });

    // Combine user data with conversation metadata
    const finalUsers = peerUsers.map(user => {
      const convInfo = partnerMap.get(user._id.toString());
      const isLocked = me.lockedUsers?.includes(user._id.toString());
      
      return {
        ...user.toObject(),
        lastMessage: convInfo.lastMessage,
        lastMessageTime: convInfo.lastMessageTime,
        unreadCount: convInfo.unreadCount,
        locked: !!isLocked,
      };
    }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    return NextResponse.json({ success: true, users: finalUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
