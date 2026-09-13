import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReaction {
  emoji: string;
  userId: string;
}

export interface IMessage extends Document {
  chatId?: string; // Opt for simple sender/receiver or structured conversations
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  text: string;
  image?: string;
  read: boolean;
  reactions?: IReaction[];
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    image: { type: String },
    read: { type: Boolean, default: false },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Index to quickly fetch conversations between two users
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
