const CallService = require("../../services/callManagementService");
const { v4: uuidv4 } = require("uuid");
const CustomError = require("../../utils/customError");

module.exports = (io, socket, onlineUsers) => {
  /**
   * Event: initiateCall
   * Handles initiating a call by sending an offer.
   */
  socket.on("initiateCall", async ({ callerId, calleeId, callType, offer }, callback) => {
    try {
      const callId = uuidv4();

      // Create a new call
      const newCall = await CallService.createCall({
        callId,
        participants: [callerId, calleeId],
        callType,
        status: "initiated",
      });

      // Notify the recipient
      const calleeSocketId = onlineUsers.get(calleeId);

      if (calleeSocketId) {
        console.log(`Notifying recipient (${calleeId}) about the call request.`);
        io.to(calleeSocketId).emit("callRequest", {
          callId,
          callerId,
          callType,
          offer,
        });
      } else {
        // Fallback for offline recipient (keep FCM notification commented)
        /*
        const fcmToken = await getUserFcmToken(calleeId);
        if (fcmToken) {
          const payload = {
            notification: {
              title: "Incoming Call",
              body: `You have an incoming ${callType} call from ${callerId}`,
            },
            data: {
              callId,
              callerId,
              callType,
              offer: JSON.stringify(offer),
            },
          };
          await sendNotification(fcmToken, payload);
        }
        */
        console.log(`Recipient (${calleeId}) is offline. Call notification skipped.`);
      }

      callback({ success: true, callId });
    } catch (error) {
      console.error("Error in initiateCall event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: acceptCall
   * Handles the recipient accepting a call by sending an answer.
   */
  socket.on("acceptCall", async ({ callId, calleeId, answer }, callback) => {
    try {
      const updatedCall = await CallService.updateCall(callId, {
        status: "active",
        startedAt: new Date(),
      });

      const callerId = updatedCall.participants.find((id) => id !== calleeId).toString();
      const callerSocketId = onlineUsers.get(callerId);

      if (callerSocketId) {
        console.log(`Notifying caller (${callerId}) about the accepted call.`);
        io.to(callerSocketId).emit("callAccepted", {
          callId,
          answer,
        });
      } else {
        console.warn(`Caller (${callerId}) is offline. Answer cannot be delivered.`);
      }

      callback({ success: true, message: "Call accepted." });
    } catch (error) {
      console.error("Error in acceptCall event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: sendIceCandidate
   * Handles relaying ICE candidates between participants.
   */
  socket.on("sendIceCandidate", async ({ callId, senderId, candidate }, callback) => {
    try {

      console.log(callId,senderId,candidate)
      // Validate input
      if (!callId || !senderId || !candidate) {
        throw new CustomError("Missing required fields: callId, senderId, or candidate.", 400);
      }

      // Fetch the call details
      const call = await CallService.getCallByCallId(callId);

      // Determine the recipient
      const recipientId = call.participants.find((participant) => participant.toString() !== senderId);
      if (!recipientId) {
        throw new CustomError("Recipient not found for the call.", 404);
      }

      // Get the recipient's socket ID
      const recipientSocketId = onlineUsers.get(recipientId.toString());

      if (recipientSocketId) {
        console.log(`Relaying ICE candidate to recipient (${recipientId}).`);
        io.to(recipientSocketId).emit("iceCandidate", { candidate });
      } else {
        console.warn(`Recipient (${recipientId}) is offline. ICE candidate cannot be delivered.`);
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error in sendIceCandidate event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: endCall
   * Handles ending a call.
   */
  socket.on("endCall", async ({ callId }, callback) => {
    try {
      const call = await CallService.getCallByCallId(callId);
      if (!call) throw new CustomError("Call not found.", 404);

      const duration = Math.max(0, (new Date() - new Date(call.initiatedAt)) / 1000);
      const updatedCall = await CallService.updateCall(callId, {
        status: "ended",
        endedAt: new Date(),
        duration,
      });

      updatedCall.participants.forEach((userId) => {
        const userSocketId = onlineUsers.get(userId);
        if (userSocketId) {
          console.log(`Notifying user (${userId}) about the call ending.`);
          io.to(userSocketId).emit("callEnded", { callId, duration });
        }
      });

      callback({ success: true, message: "Call ended successfully.", duration });
    } catch (error) {
      console.error("Error in endCall event:", error.message);
      callback({ success: false, error: error.message });
    }
  });
};
