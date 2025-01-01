
const CustomError = require("../utils/customError.js");
const responseHandler = require("../utils/responseHandler.js");
const {
  handleUploadedFiles,
  createMessage,
  getUndeliveredMessages,
  deleteMediaFile,
  fetchAllMessages,
  updateMessage
} = require("../services/messageManagementService.js");

// Upload files controller
const uploadFiles = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return responseHandler(
        res,
        400,
        "Media files are required for media messages"
      );
    }

    console.log("uploaded files in controller",req.files)

    const filesMetadata = handleUploadedFiles(req.files);

    return responseHandler(
      res,
      200,
      "Files uploaded successfully",
      filesMetadata
    );
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)
    );
  }
};


const deleteUploadedFiles = async (req, res, next) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return responseHandler(res, 400, "File URL is required");
    }

    // Call the service to delete the media file
    const deleteResponse = await deleteMediaFile(fileUrl);

    if (!deleteResponse.success) {
      return responseHandler(res, 404, deleteResponse.message);
    }

    return responseHandler(res, 200, deleteResponse.message);
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)
    );
  }
};

// Create new message with uploaded files
const newMessage = async (req, res, next) => {
  try {
    const { chatId, senderId, receiverId, messageType, content } = req.body;
    const files = req.files || [];

    const message = await createMessage({
      chatId,
      senderId,
      receiverId,
      messageType,
      content,
      files,
    });

    return responseHandler(res, 200, "Message created successfully.", message);
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)
    );
  }
};

// Get undelivered messages
const getUndeliveredMessagesController = async (req, res, next) => {
  try {
    const { receiverId } = req.params;

    const undeliveredMessages = await getUndeliveredMessages(receiverId);

    return responseHandler(
      res,
      200,
      "Undelivered messages retrieved successfully.",
      undeliveredMessages
    );
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)
    );
  }
};


const fetchAllMessagesController = async (req, res, next) => {
  try {
    const chatId = req.params.chatId;
    const { page = 1, limit = 20 } = req.query;

    // Call service to fetch messages
    const result = await fetchAllMessages(chatId, parseInt(page, 10), parseInt(limit, 10));

    // Return success response
    responseHandler(res, 200, 'Messages fetched successfully.', result);
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)
    );
  }
};


/**
 * Controller to update a message by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const updateMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const updateData = req.body;

    // Call the service method to update the message
    const updatedMessage = await updateMessage(messageId, updateData);

    res.status(200).json({
      success: true,
      message: "Message updated successfully.",
      data: updatedMessage,
    });
  } catch (error) {
    next(error); // Pass error to the error handler middleware
  }
};




module.exports = {
  uploadFiles,
  newMessage,
  getUndeliveredMessagesController,
  deleteUploadedFiles,
  fetchAllMessagesController,
  updateMessageController
};





















