const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    meetingId: { type: String, unique: true, required: true }, // Unique meeting ID
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Meeting host
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date },
        leftAt: { type: Date },
      },
    ], // Meeting participants
    status: {
      type: String,
      enum: ["scheduled", "active", "ended"],
      default: "scheduled",
    },
    startTime: { type: Date }, // Scheduled start time
    endTime: { type: Date }, // Scheduled end time
    actualStartTime: { type: Date }, // When the meeting actually started
    actualEndTime: { type: Date }, // When the meeting ended
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", MeetingSchema);
