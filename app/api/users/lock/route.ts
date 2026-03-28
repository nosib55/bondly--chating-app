import { NextResponse } from "next/server";
import { connectDB } from "@/server/config/db";
import User from "@/server/modules/user/user.model";

/**
 * POST /api/users/lock
 * Body: { myUid: string, peerUserId: string }
 * Toggles peerUserId in the lockedUsers list of myUid.
 */
export async function POST(req: Request) {
  try {
    const { myUid, peerUserId } = await req.json();

    if (!myUid || !peerUserId) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    const me = (await User.findOne({ firebaseUid: myUid })) as any;
    if (!me) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const isLocked = me.lockedUsers?.includes(peerUserId);

    if (isLocked) {
      // Unlock
      me.lockedUsers = me.lockedUsers.filter((id: string) => id !== peerUserId);
    } else {
      // Lock
      if (!me.lockedUsers) me.lockedUsers = [];
      me.lockedUsers.push(peerUserId);
    }

    await me.save();

    return NextResponse.json({ success: true, isLocked: !isLocked });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
