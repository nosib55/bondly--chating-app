import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  online: boolean;
  lastSeen: Date;
  lockedUsers: string[];
  autoDelete12h?: boolean;
  contacts?: (mongoose.Types.ObjectId | string)[];
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: "" },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    lockedUsers: { type: [String], default: [] },
    autoDelete12h: { type: Boolean, default: false },
    contacts: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

