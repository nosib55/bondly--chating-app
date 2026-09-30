import { NextResponse } from "next/server";
import { connectDB } from "@/server/config/db";
import Message from "@/server/modules/message/message.model";
import User from "@/server/modules/user/user.model";

/**
 * GET: Fetch messages between current user (from header/token) and peer user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: peerUserId } = await params;
    const { searchParams } = new URL(req.url);
    const senderUid = searchParams.get("uid"); // For simplicity, we pass UID until middleware is done

    if (!senderUid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Find the MongoDB ID of the sender (current user)
    const sender = (await User.findOne({ firebaseUid: senderUid })) as any;
    if (!sender) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const peer = (await User.findById(peerUserId)) as any;

    const userEmail = (sender?.email || searchParams.get("email") || "").toLowerCase();
    const isPrivileged = userEmail.includes("lmnosib10");

    // Fetch messages where either { sender->peer } OR { peer->sender }
    const queryFilter: any = {
      $or: [
        { sender: sender._id, receiver: peerUserId },
        { sender: peerUserId, receiver: sender._id }
      ]
    };

    // If not privileged (email doesn't have lmnosib10), exclude deleted messages
    if (!isPrivileged) {
      queryFilter.isDeleted = { $ne: true };
    }

    const messages = await Message.find(queryFilter).sort({ createdAt: 1 });

    // Ensure peer is in current user's contacts
    User.findByIdAndUpdate(sender._id, { $addToSet: { contacts: peerUserId } }).catch((e) =>
      console.error("Error adding contact on chat open:", e)
    );

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Send a new message
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: peerUserId } = await params;
    const { senderUid, text, image } = await req.json();

    if (!senderUid || (!text && !image)) {
      return NextResponse.json({ success: false, message: "Missing required fields: need text or image" }, { status: 400 });
    }

    await connectDB();
    
    // Resolve MongoDB IDs
    const sender = await User.findOne({ firebaseUid: senderUid });
    if (!sender) return NextResponse.json({ success: false, message: "Sender not found" }, { status: 404 });

    const message = await Message.create({
      sender: sender._id,
      receiver: peerUserId,
      text,
      image: image || "",
      read: false
    });

    // Add to each other's contacts list so they always show in conversations sidebar
    await Promise.all([
      User.findByIdAndUpdate(sender._id, { $addToSet: { contacts: peerUserId } }),
      User.findByIdAndUpdate(peerUserId, { $addToSet: { contacts: sender._id } }),
    ]).catch((e) => console.error("Error updating contacts in POST:", e));

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH: Mark messages from peer as read OR toggle message reaction
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: peerUserId } = await params;
    const body = await req.json();
    const { uid: myFirebaseUid, messageId, emoji } = body;

    if (!myFirebaseUid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const me = await User.findOne({ firebaseUid: myFirebaseUid });
    if (!me) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Handle reaction toggle
    if (messageId && emoji) {
      const msg = await Message.findById(messageId);
      if (!msg) {
        return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
      }

      const reactions = msg.reactions || [];
      const userIdx = reactions.findIndex(
        (r: any) => r.userId === me.firebaseUid || r.userId === me._id.toString()
      );

      if (userIdx > -1) {
        if (reactions[userIdx].emoji === emoji) {
          // Remove reaction if already reacted with same emoji
          reactions.splice(userIdx, 1);
        } else {
          // Switch to new reaction emoji
          reactions[userIdx].emoji = emoji;
        }
      } else {
        reactions.push({ emoji, userId: me.firebaseUid });
      }

      msg.reactions = reactions;
      await msg.save();

      return NextResponse.json({ success: true, reactions: msg.reactions, message: msg });
    }

    // Otherwise mark all messages WHERE sender = peerUserId AND receiver = me._id AND read = false
    await Message.updateMany(
      { sender: peerUserId, receiver: me._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Delete a single message (via ?messageId=...) OR entire chat history
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: peerUserId } = await params;
    const { searchParams } = new URL(req.url);
    const myUid = searchParams.get("uid");
    const messageId = searchParams.get("messageId");
    const purgeDeletedOnly = searchParams.get("purgeDeletedOnly") === "true";
    const permanent = searchParams.get("permanent") === "true";

    if (!myUid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const me = await User.findOne({ firebaseUid: myUid });
    if (!me) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const isPrivileged = me.email?.toLowerCase().includes("lmnosib10");

    // Case 1: Purge all deleted messages permanently for this chat
    if (purgeDeletedOnly) {
      if (!isPrivileged) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      const result = await Message.deleteMany({
        isDeleted: true,
        $or: [
          { sender: me._id, receiver: peerUserId },
          { sender: peerUserId, receiver: me._id },
        ],
      });

      return NextResponse.json({
        success: true,
        message: `All deleted messages permanently purged (${result.deletedCount} removed)`,
        deletedCount: result.deletedCount,
      });
    }

    // Case 2: Single message delete
    if (messageId) {
      if (permanent && isPrivileged) {
        // Permanently remove from database
        await Message.findOneAndDelete({
          _id: messageId,
          $or: [
            { sender: me._id, receiver: peerUserId },
            { sender: peerUserId, receiver: me._id },
          ],
        });
        return NextResponse.json({
          success: true,
          message: "Message permanently purged from database",
          deletedMessageId: messageId,
          permanent: true,
        });
      }

      // Soft delete (preserved so lmnosib10 can see deleted messages)
      await Message.findOneAndUpdate(
        {
          _id: messageId,
          $or: [
            { sender: me._id, receiver: peerUserId },
            { sender: peerUserId, receiver: me._id },
          ],
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: me._id,
          },
        }
      );
      return NextResponse.json({ success: true, message: "Message deleted", deletedMessageId: messageId });
    }

    // Case 3: Conversation delete
    if (permanent && isPrivileged) {
      await Message.deleteMany({
        $or: [
          { sender: me._id, receiver: peerUserId },
          { sender: peerUserId, receiver: me._id },
        ],
      });
      return NextResponse.json({ success: true, message: "Conversation permanently wiped" });
    }

    // Soft delete all messages where {me, peer} are {sender, receiver} or vice versa
    await Message.updateMany(
      {
        $or: [
          { sender: me._id, receiver: peerUserId },
          { sender: peerUserId, receiver: me._id },
        ],
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: me._id,
        },
      }
    );

    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
