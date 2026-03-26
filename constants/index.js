// ─── Static dummy data for UI development ─────────────────────────────────

export const CURRENT_USER = {
  id: "me",
  name: "Alex Rivera",
  username: "@alexrivera",
  avatar: null,
  avatarColor: "#6c63ff",
  online: true,
};

export const USERS = [
  { id: "u1", name: "Sophia Lee",     username: "@sophialee",   avatar: null, avatarColor: "#ec4899", online: true  },
  { id: "u2", name: "Marcus Chen",    username: "@marcuschen",  avatar: null, avatarColor: "#f59e0b", online: false },
  { id: "u3", name: "Priya Sharma",   username: "@priyasharma", avatar: null, avatarColor: "#10b981", online: true  },
  { id: "u4", name: "Jordan Kim",     username: "@jordankim",   avatar: null, avatarColor: "#3b82f6", online: false },
  { id: "u5", name: "Zara Ahmed",     username: "@zaraahmed",   avatar: null, avatarColor: "#f43f5e", online: true  },
  { id: "u6", name: "Liam O'Brien",   username: "@liamobbrien", avatar: null, avatarColor: "#8b5cf6", online: true  },
];

export const CHATS = [
  {
    id: "c1", userId: "u1", unread: 3,
    lastMessage: "Are we still on for tonight? 🎉",
    lastTime: "2:41 PM",
    typing: false,
  },
  {
    id: "c2", userId: "u2", unread: 0,
    lastMessage: "I'll send you the files shortly.",
    lastTime: "Yesterday",
    typing: false,
  },
  {
    id: "c3", userId: "u3", unread: 1,
    lastMessage: "That design looks great!",
    lastTime: "Yesterday",
    typing: true,
  },
  {
    id: "c4", userId: "u4", unread: 0,
    lastMessage: "Haha yeah, that was unexpected 😂",
    lastTime: "Mon",
    typing: false,
  },
  {
    id: "c5", userId: "u5", unread: 7,
    lastMessage: "Can you review my PR when free?",
    lastTime: "Sun",
    typing: false,
  },
  {
    id: "c6", userId: "u6", unread: 0,
    lastMessage: "See you tomorrow!",
    lastTime: "Fri",
    typing: false,
  },
];

export const MESSAGES = {
  c1: [
    { id: "m1",  senderId: "u1", text: "Hey Alex! How've you been?",                          time: "2:30 PM", read: true  },
    { id: "m2",  senderId: "me", text: "All good! Just been super busy with the new project.", time: "2:32 PM", read: true  },
    { id: "m3",  senderId: "u1", text: "Oh nice, what are you working on?",                   time: "2:33 PM", read: true  },
    { id: "m4",  senderId: "me", text: "A chat app actually — it's called Bondly 🚀",          time: "2:35 PM", read: true  },
    { id: "m5",  senderId: "u1", text: "That sounds awesome! Can I beta test it?",             time: "2:36 PM", read: true  },
    { id: "m6",  senderId: "me", text: "Of course! I'll send you an invite link soon.",        time: "2:38 PM", read: true  },
    { id: "m7",  senderId: "u1", text: "Are we still on for tonight? 🎉",                     time: "2:41 PM", read: false },
  ],
  c2: [
    { id: "m1",  senderId: "me", text: "Hey Marcus, do you have those design files?",         time: "Yesterday", read: true },
    { id: "m2",  senderId: "u2", text: "I'll send you the files shortly.",                    time: "Yesterday", read: true },
  ],
  c3: [
    { id: "m1",  senderId: "u3", text: "Just finished the mockup for the dashboard.",         time: "Yesterday", read: true },
    { id: "m2",  senderId: "me", text: "That design looks great!",                            time: "Yesterday", read: true },
    { id: "m3",  senderId: "u3", text: null, typing: true,                                    time: "Now",       read: false },
  ],
  c4: [
    { id: "m1",  senderId: "u4", text: "Did you see what happened in the meeting?",           time: "Mon", read: true },
    { id: "m2",  senderId: "me", text: "Haha yeah, that was unexpected 😂",                  time: "Mon", read: true },
  ],
  c5: [
    { id: "m1",  senderId: "u5", text: "Hey, can you review my PR when free?",                time: "Sun", read: false },
    { id: "m2",  senderId: "u5", text: "It's a pretty big one, needs feedback.",              time: "Sun", read: false },
    { id: "m3",  senderId: "u5", text: "No rush, just whenever you get a chance 🙏",         time: "Sun", read: false },
  ],
  c6: [
    { id: "m1",  senderId: "me", text: "Cool, let's sync up tomorrow then.",                  time: "Fri", read: true },
    { id: "m2",  senderId: "u6", text: "See you tomorrow!",                                   time: "Fri", read: true },
  ],
};
