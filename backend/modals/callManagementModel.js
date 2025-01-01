const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
  {
    callId: { type: String, unique: true, required: true }, // Unique identifier for the call
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ], // Exactly 2 participants
    callType: { type: String, enum: ["audio", "video"], required: true }, // Type of call
    status: {
      type: String,
      enum: ["initiated", "ringing", "active", "ended", "missed"],
      default: "initiated",
    }, // Call status
    initiatedAt: { type: Date, default: Date.now },
    startedAt: { type: Date }, // When the call was answered
    endedAt: { type: Date }, // When the call ended
    duration: { type: Number }, // Duration in seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", CallSchema);
