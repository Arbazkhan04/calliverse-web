const admin = require("../config/firebase-config");
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
    // Check if tokens is a single string, convert to array
    if (typeof tokens === "string") {
      tokens = [tokens];
    }

    const message = {
      tokens,
      ...payload,
    };

    // Send notification using FCM
    const response = await admin.messaging().sendMulticast(message);

    // Check for failed tokens
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

module.exports = { sendNotification };
