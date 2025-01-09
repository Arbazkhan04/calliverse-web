const { saveFcmToken ,sendNotificationService} = require("../services/FCMService");
const responseHandler = require("../utils/responseHandler");
const admin = require("../config/firebase");
const CustomError = require("../utils/customError");

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




/**
 * Controller to send a notification.
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @param {Function} next - Next middleware.
 */
const sendNotificationController = async (req, res, next) => {
  try {
    const { fcmTokens, payload } = req.body;

    if (!fcmTokens || !payload) {
      throw new CustomError("FCM tokens and payload are required.", 400);
    }

    // Call the service to handle the logic
    const response = await sendNotificationService(fcmTokens, payload);

    // Use response handler for consistent API response
    responseHandler(res, 200, "Notification sent successfully.", response);
  } catch (error) {
    next(error instanceof CustomError ? error : new CustomError(error.message, 500));
  }
};



module.exports = { saveFcmTokenController,sendNotificationController };
