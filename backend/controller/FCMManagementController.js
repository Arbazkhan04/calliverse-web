const { saveFcmToken } = require("../services/FCMService");
const responseHandler = require("../utils/responseHandler");

/**
 * Controller to save or update an FCM token for a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const saveFcmTokenController = async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return responseHandler(res, 400, "userId and token are required.");
    }

    const updatedUser = await saveFcmToken(userId, token);
    return responseHandler(res, 200, "FCM token saved successfully.", {
      userId: updatedUser._id,
      fcmTokens: updatedUser.fcmTokens,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveFcmTokenController };
