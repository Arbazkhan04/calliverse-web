const User = require("../modals/userManagementModal");
const CustomError = require("../utils/customError");
const { sendNotification } = require("../utils/sendNotification");

/**
 * Adds or updates an FCM token for a user.
 * @param {String} userId - The ID of the user.
 * @param {String} token - The FCM token to add or update.
 * @returns {Promise<Object>} - The updated user document.
 */
const saveFcmToken = async (userId, token) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found.", 404);
    }

    // Add token only if it doesn't already exist
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    return user;
  } catch (error) {
    throw new CustomError(error.message || "Failed to save FCM token.", 500);
  }
};


/**
 * Service to handle sending notifications using FCM.
 * @param {String|Array} fcmTokens - FCM token(s) of the device(s).
 * @param {Object} payload - The notification payload (contains notification and data).
 * @returns {Promise<Object>} - Response from FCM.
 */
const sendNotificationService = async (fcmTokens, payload) => {
  try {
    if (!fcmTokens || !payload) {
      throw new CustomError("FCM tokens and payload are required.", 400);
    }

    // Call the helper function to send notifications
    const response = await sendNotification(fcmTokens, payload);

    return response;
  } catch (error) {
    console.error("Error in sendNotificationService:", error.message);
    throw new CustomError(error.message || "Failed to send notification", 500);
  }
};


module.exports = { saveFcmToken,sendNotificationService };
