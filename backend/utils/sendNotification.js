const admin = require("../config/firebase");
const CustomError = require("../utils/customError");

/**
 * Sends a notification to a user or a group of users.
 * @param {String|Array} tokens - FCM token(s) of the device(s) to send the notification.
 * @param {Object} payload - The notification payload (contains notification and data).
 * @param {Object} options - Additional FCM options (optional).
 * @returns {Promise<Object>} - Response from FCM.
 */
const sendNotification = async (tokens, payload, options = {}) => {
  try {
    // Ensure tokens is an array
    if (typeof tokens === "string") {
      tokens = [tokens];
    }

    // Filter out any invalid or empty tokens
    tokens = tokens.filter((token) => token && token.trim() !== "");

    if (tokens.length === 0) {
      throw new CustomError("No valid FCM tokens provided.", 400);
    }

    const message = {
      ...payload,
      ...options,
    };

    let response;

    if (tokens.length === 1) {
      //validate token
      const validateTOken = await validateToken(tokens[0]);
      // Send to a single device
      message.token = tokens[0];
      response = await admin.messaging().send(message);
    } else {
      // Send to multiple devices
      message.tokens = tokens;
      response = await admin.messaging().sendMulticast(message);
    }

    // Handle any failures in the response
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      if (failedTokens.length) {
        throw new CustomError(
          `Failed to send notification to tokens: ${failedTokens.join(", ")}`,
          400
        );
      }
    }

    console.log("FCM Notification Sent Successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending FCM Notification:", error.message);
    throw new CustomError(error.message || "Failed to send notification", 500);
  }
};

async function validateToken(fcmToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(fcmToken);
    console.log("Decoded Token:", decodedToken);
  } catch (error) {
    console.error("Invalid FCM Token:", error.message);
  }
}

module.exports = { sendNotification };
