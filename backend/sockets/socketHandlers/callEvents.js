const CallService = require("../../services/callManagementService");
const { v4: uuidv4 } = require("uuid");
const CustomError = require("../../utils/customError");
// const { getUserFcmToken } = require("../../utils/getFCMToken");
// const { sendNotification } = require("../../utils/sendNotification");

module.exports = (io, socket, onlineUsers) => {
  /**
   * Event: initiateCall
   * Handles initiating a call and determining the recipient's state.
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
        // Recipient is online via WebSocket
        io.to(calleeSocketId).emit("callRequest", {
          callId,
          callerId,
          callType,
          offer,
        });
      } else {
        // Fallback logic for offline recipient (Firebase notifications commented out)
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
        console.log(`Recipient (${calleeId}) is offline, skipping FCM notification.`);
      }

      // Set a timeout for unanswered calls
      setTimeout(async () => {
        const call = await CallService.getCallByCallId(callId);

        // If the call is still "initiated", mark it as "missed"
        if (call && call.status === "initiated") {
          await CallService.updateCall(callId, { status: "missed" });

          // Notify the caller about the missed call
          const callerSocketId = onlineUsers.get(callerId);
          if (callerSocketId) {
            io.to(callerSocketId).emit("callMissed", { callId, calleeId });
          }

          // Optionally notify the callee about the missed call (commented out)
          /*
          const fcmToken = await getUserFcmToken(calleeId);
          if (fcmToken) {
            const missedPayload = {
              notification: {
                title: "Missed Call",
                body: `You missed a ${callType} call from ${callerId}.`,
              },
              data: {
                callId,
                callerId,
                callType,
              },
            };
            await sendNotification(fcmToken, missedPayload);
          }
          */
        }
      }, 30000); // 30 seconds timeout for unanswered calls

      callback({ success: true, callId });
    } catch (error) {
      console.error("Error in initiateCall event:", error.message);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Event: acceptCall
   * Handles the recipient accepting a call and notifying the caller.
   */
  socket.on("acceptCall", async ({ callId,calleeId, answer }, callback) => {
    try {


        console.log("answer is here",answer)
      // Update call status to active using the service
      const updatedCall = await CallService.updateCall(callId, {
        status: "active",
        startedAt: new Date(),
      });

      // Notify the caller
      const callerId = updatedCall.participants.find((id) => id !== calleeId).toString();
      console.log("caller id to send answer",callerId)
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("callAccepted", { callId, answer });
      }

      // Acknowledge the recipient
      callback({ success: true, message: "Call accepted." });
    } catch (error) {
      console.error("Error in acceptCall event:", error.message);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  /**
   * Event: candidate
   * Handles the transfer of ICE candidates between peers.
   */
  socket.on("candidate", async ({ callId, callerId, candidate }, callback) => {
    try {
      const call = await CallService.getCallByCallId(callId);

      console.log("call in candidate event",call)
      if (!call) {
        throw new CustomError(`Call with ID ${callId} not found.`, 404);
      }

      const recipientId = call.participants.find((id) => id !== callerId).toString();

      console.log("id of candidate event recepient",recipientId)
      if (!recipientId) {
        throw new CustomError(`Recipient for call ${callId} not found.`, 400);
      }

      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("candidate", { candidate, callId });
        callback({ success: true, message: "Candidate forwarded successfully." });
      } else {
        callback({ success: false, message: "Recipient is offline." });
      }
    } catch (error) {
      console.error("Error handling candidate event:", error.message);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  /**
   * Event: endCall
   * Handles ending a call and notifying both parties.
   */
  socket.on("endCall", async ({ callId }, callback) => {
    try {
      const call = await CallService.getCallByCallId(callId);
      if (!call) throw new CustomError("Call not found.", 404);

      const duration = (new Date() - call.startedAt) / 1000;
      const updatedCall = await CallService.updateCall(callId, {
        status: "ended",
        endedAt: new Date(),
        duration,
      });

      updatedCall.participants.forEach((userId) => {
        const userSocketId = onlineUsers.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit("callEnded", { callId, duration });
        }
      });

      callback({ success: true, message: "Call ended successfully.", duration });
    } catch (error) {
      console.error("Error in endCall event:", error.message);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });
};
