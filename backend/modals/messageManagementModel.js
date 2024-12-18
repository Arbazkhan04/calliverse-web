const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat", // Reference to the Chat model
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "media"], // "media" type will hold all files (images, videos, docs)
      required: true,
    },
    content: {
      type: String, // For text messages or file references
      required: function () {
        return this.messageType === "text";
      },
    },
    files: [
      {
        fileType: {
          type: String, // Type of file ('image', 'video', 'document', 'audio')
          enum: ["image", "video", "document", "audio"],
        },
        fileName: { type: String },
        fileUrl: { type: String },
        fileSize: { type: Number }, // Optional: Size of the file in bytes
        duration: { type: Number }, // Duration of the voice note, applicable only to audio files
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    delivered: { type: Boolean, default: false },

    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
        },
      },
    ], // List of users who have read the message

    isSeen: {
      status: {
        type: Boolean,
        default:false,
      },
      readAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
