import { NextResponse } from "next/server";
import { connectDB } from "@/server/config/db";
import User from "@/server/modules/user/user.model";

/**
 * GET: Fetch all users (simple for UI demo)
 */
export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Sync or create user record after Firebase signup
 */
export async function POST(req: Request) {
  try {
    const { firebaseUid, name, email, avatar } = await req.json();

    if (!firebaseUid || !email) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Create new user record
      user = await User.create({
        firebaseUid,
        name,
        email,
        avatar: avatar || "",
        online: true,
        lastSeen: new Date()
      });
    } else {
      // Update existing record with online status
      user.online = true;
      user.lastSeen = new Date();
      await user.save();
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
