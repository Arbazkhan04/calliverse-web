const User = require("../modals/userManagementModal"); // Adjust the path to the User model as needed
const CustomError = require("../utils/customError"); // Adjust the path to your custom error handler

/**
 * Fetches the FCM token(s) for a user from the database.
 * @param {String} userId - The ID of the user whose FCM token(s) are being fetched.
 * @returns {Promise<String[]>} - Returns a promise that resolves to the user's FCM tokens or an empty array if none exist.
 * @throws {CustomError} - Throws a custom error if the user does not exist or there is a database issue.
 */
async function getUserFcmToken(userId) {
  try {
    const user = await User.findById(userId, "fcmTokens"); // Only fetch fcmTokens field
    if (!user) {
      throw new CustomError(`User with ID ${userId} not found.`, 404);
    }
    return user.fcmTokens || [];
  } catch (error) {
    console.error(`Error fetching FCM tokens for user ${userId}:`, error.message);

    if (error instanceof CustomError) {
      throw error; // Rethrow custom errors
    }

    throw new CustomError("Failed to fetch FCM tokens.", 500);
  }
}

module.exports = { getUserFcmToken };
