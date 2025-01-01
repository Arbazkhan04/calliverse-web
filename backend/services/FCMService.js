const User = require("../modals/userManagementModal");
const CustomError = require("../utils/customError");

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

module.exports = { saveFcmToken };
