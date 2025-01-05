const CallService = require("../../services/callManagementService");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin"); // For FCM notifications
const CustomError = require("../../utils/customError");

module.exports = (io, socket, onlineUsers) => {
   /**
   * Event: initiateCall
   * Handles initiating a call and determining the recipient's state.
   */
   socket.on("initiateCall", async ({ callerId, calleeId, callType, offer, candidates }, callback) => {
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
        // Emit callRequest if the recipient's socket is connected
        io.to(calleeSocketId).emit("callRequest", {
            callId,
            callerId,
          callType,
          offer,
          candidates,
        });
      } else {
        // Fallback: Send FCM notification if the recipient is not connected to WebSocket
        const fcmToken = getUserFcmToken(calleeId);
        if (fcmToken) {
          const message = {
            token: fcmToken,
            notification: {
              title: "Incoming Call",
              body: `You have an incoming ${callType} call from ${callerId}`,
            },
            data: {
              callId,
              callerId,
              callType,
              offer,
              candidates,
            },
          };
          await admin.messaging().send(message);
        }
      }

      // Set a timeout for unanswered calls
      setTimeout(async () => {
        const call = await CallService.getCallByCallId(callId);

        // If the call is still "initiated", mark it as "missed"
        if (call.status === "initiated") {
          await CallService.updateCall(callId, { status: "missed" });

          // Notify the caller about the missed call
          const callerSocketId = onlineUsers.get(callerId);
          if (callerSocketId) {
            io.to(callerSocketId).emit("callMissed", { callId, calleeId });
          }

          // Optionally notify the callee about the missed call
          if (fcmToken) {
            const missedMessage = {
              token: fcmToken,
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
            await admin.messaging().send(missedMessage);
          }
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
  socket.on("acceptCall", async ({ callId, answer, candidates }, callback) => {
    try {
      // Update call status to active using the service
      const updatedCall = await CallService.updateCall(callId, {
        status: "active",
        startedAt: new Date(),
      });

      // Notify the caller
      const callerId = updatedCall.participants.find((id) => id !== socket.userId); // Assuming `userId` is set on the socket
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("callAccepted", { callId, answer, candidates });
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
   * Event: endCall
   * Handles ending a call and notifying both parties.
   */
  socket.on("endCall", async ({ callId }, callback) => {
    try {
      // Fetch the call details using the service
      const call = await CallService.getCallByCallId(callId);
      if (!call) throw new CustomError("Call not found.", 404);

      // Calculate duration and update call status
      const duration = (new Date() - call.startedAt) / 1000;
      const updatedCall = await CallService.updateCall(callId, {
        status: "ended",
        endedAt: new Date(),
        duration,
      });

      // Notify both parties
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

  /**
   * Event: archiveCall
   * Handles archiving a call for a specific user.
   */
  socket.on("archiveCall", async ({ callId, userId }, callback) => {
    try {
      // Archive the call for the user using the service
      const updatedCall = await CallService.deleteCallForUser(callId, userId);

      callback({
        success: true,
        message: "Call archived successfully.",
        data: updatedCall,
      });
    } catch (error) {
      console.error("Error in archiveCall event:", error.message);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  /**
   * Event: getCallDetails
   * Fetches the details of a call by its ID.
   */
  socket.on("getCallDetails", async ({ callId }, callback) => {
    try {
      // Get call details using the service
      const callDetails = await CallService.getCallByCallId(callId);

      callback({
        success: true,
        message: "Call details fetched successfully.",
        data: callDetails,
      });
    } catch (error) {
      console.error("Error in getCallDetails event:", error.message);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  /**
   * Helper Function: getUserFcmToken
   * Fetches the FCM token for a user from the database.
   */
  function getUserFcmToken(userId) {
    // Implement this function to fetch the user's FCM token from your database
    return null;
  }
};
