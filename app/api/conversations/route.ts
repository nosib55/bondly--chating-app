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

    // If 12h auto-delete is enabled, purge expired messages for both sides
    if (me.autoDelete12h) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      await Message.deleteMany({
        $or: [{ sender: me._id }, { receiver: me._id }],
        createdAt: { $lt: twelveHoursAgo },
      });
    }

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: me._id }, { receiver: me._id }],
    }).sort({ createdAt: -1 });

    // Collect partners from both me.contacts and existing messages
    const partnerMap = new Map<string, any>();
    const meIdStr = me._id.toString();

    // 1. Pre-fill partnerMap with existing contacts from user profile
    if (Array.isArray(me.contacts)) {
      for (const contactId of me.contacts) {
        if (!contactId) continue;
        const cStr = contactId.toString();
        if (cStr !== meIdStr) {
          partnerMap.set(cStr, {
            lastMessage: "",
            lastMessageTime: null,
            unreadCount: 0,
          });
        }
      }
    }

    // 2. Overlay messages data
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
      } else {
        const existing = partnerMap.get(partnerId);
        if (!existing.lastMessageTime) {
          existing.lastMessage = msg.text || (msg.image ? "Sent a photo" : "");
          existing.lastMessageTime = msg.createdAt;
        }
      }

      // If I am the receiver and message is unread, increment count
      if (receiverId === meIdStr && !msg.read) {
        partnerMap.get(partnerId).unreadCount += 1;
      }
    }

    const allPartnerIds = Array.from(partnerMap.keys());
    if (allPartnerIds.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // Synchronize contacts into user document in background if new ones detected
    User.findByIdAndUpdate(me._id, {
      $addToSet: { contacts: { $each: allPartnerIds } },
    }).catch((err) => console.error("Error auto-syncing contacts:", err));

    // Fetch the peer user documents
    const peerUsers = await User.find({ _id: { $in: allPartnerIds } });

    // Combine user data with conversation metadata
    const finalUsers = peerUsers
      .map((user) => {
        const convInfo = partnerMap.get(user._id.toString()) || {
          lastMessage: "",
          lastMessageTime: null,
          unreadCount: 0,
        };
        const isLocked = me.lockedUsers?.includes(user._id.toString());

        return {
          ...user.toObject(),
          lastMessage: convInfo.lastMessage,
          lastMessageTime: convInfo.lastMessageTime,
          unreadCount: convInfo.unreadCount,
          locked: !!isLocked,
        };
      })
      .sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        const fallbackA = (a as any).updatedAt || (a as any).lastSeen || 0;
        const fallbackB = (b as any).updatedAt || (b as any).lastSeen || 0;
        return new Date(fallbackB).getTime() - new Date(fallbackA).getTime();
      });

    return NextResponse.json({ success: true, users: finalUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

