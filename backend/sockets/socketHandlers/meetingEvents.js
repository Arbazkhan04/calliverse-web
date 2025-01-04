const MeetingService = require("../../services/meetingsManagementService");

module.exports = (io, socket, onlineUsers) => {
  /**
   * Event: createMeeting
   * Handles meeting creation by the host.
   */
  socket.on("createMeeting", async ({ hostId, meetingId, startTime, endTime }, callback) => {
    try {
      const meeting = await MeetingService.createMeeting({
        meetingId,
        host: hostId,
        startTime,
        endTime,
        status: "scheduled",
      });

      callback({ success: true, data: meeting });
    } catch (error) {
      console.error("Error in createMeeting event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: joinMeeting
   * Adds a participant to the meeting.
   */
  socket.on("joinMeeting", async ({ meetingId, userId }, callback) => {
    try {
      const meeting = await MeetingService.addParticipant(meetingId, { userId, joinedAt: new Date() });

      // Notify other participants
      const participants = meeting.participants.filter((p) => p.userId.toString() !== userId);
      participants.forEach((participant) => {
        const participantSocketId = onlineUsers.get(participant.userId.toString());
        if (participantSocketId) {
          io.to(participantSocketId).emit("participantJoined", { meetingId, userId });
        }
      });

      callback({ success: true, data: meeting });
    } catch (error) {
      console.error("Error in joinMeeting event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: leaveMeeting
   * Removes a participant from the meeting.
   */
  socket.on("leaveMeeting", async ({ meetingId, userId }, callback) => {
    try {
      const meeting = await MeetingService.removeParticipant(meetingId, userId);

      // Notify other participants
      const participants = meeting.participants.filter((p) => p.userId.toString() !== userId);
      participants.forEach((participant) => {
        const participantSocketId = onlineUsers.get(participant.userId.toString());
        if (participantSocketId) {
          io.to(participantSocketId).emit("participantLeft", { meetingId, userId });
        }
      });

      callback({ success: true, data: meeting });
    } catch (error) {
      console.error("Error in leaveMeeting event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: endMeeting
   * Ends the meeting and notifies participants.
   */
  socket.on("endMeeting", async ({ meetingId, hostId }, callback) => {
    try {
      const meeting = await MeetingService.updateMeeting(meetingId, {
        status: "ended",
        actualEndTime: new Date(),
      });

      // Notify all participants
      meeting.participants.forEach((participant) => {
        const participantSocketId = onlineUsers.get(participant.userId.toString());
        if (participantSocketId) {
          io.to(participantSocketId).emit("meetingEnded", { meetingId });
        }
      });

      callback({ success: true, data: meeting });
    } catch (error) {
      console.error("Error in endMeeting event:", error.message);
      callback({ success: false, error: error.message });
    }
  });
};
