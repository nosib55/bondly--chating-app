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
    const sender = await User.findOne({ firebaseUid: senderUid });
    if (!sender) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Fetch messages where either { sender->peer } OR { peer->sender }
    const messages = await Message.find({
      $or: [
        { sender: sender._id, receiver: peerUserId },
        { sender: peerUserId, receiver: sender._id }
      ]
    }).sort({ createdAt: 1 });

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

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH: Mark messages from peer as read
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: peerUserId } = await params;
    const { uid: myFirebaseUid } = await req.json();

    if (!myFirebaseUid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const me = await User.findOne({ firebaseUid: myFirebaseUid });
    if (!me) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Mark all messages WHERE sender = peerUserId AND receiver = me._id AND read = false
    await Message.updateMany(
      { sender: peerUserId, receiver: me._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
