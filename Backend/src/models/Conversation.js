const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantType: { type: String, enum: ['direct', 'group', 'broadcast'], default: 'direct' },
  lastMessage: { type: String },
  lastMessageTime: { type: Date },
  unreadCounts: { type: Map, of: Number, default: {} },
  isBroadcast: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
