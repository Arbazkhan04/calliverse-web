const CustomError = require("../utils/customError.js");
const Message = require("../modals/messageManagementModel.js");
const Chat = require("../modals/chatManagementModel.js");
const deleteFile = require("../utils/deleteFile-Helper.js");

const ContaboService = require("../services/contaboFileStorageService");

// Utility function to handle file upload metadata
const handleUploadedFiles = (files) => {
  console.log("files in utility function", files);
  return files?.media?.map((file) => {
    let fileType;

    if (file.mimetype.startsWith("image/")) fileType = "image";
    else if (file.mimetype.startsWith("audio/")) fileType = "audio";
    else if (file.mimetype.startsWith("video/")) fileType = "video";
    else fileType = "document";

    return {
      fileType: fileType,
      fileName: file?.filename,
      fileUrl: file?.path,
      fileSize: file?.size,
      duration: file?.mimetype.startsWith("audio/") ? file.duration : undefined,
    };
  });
};

// Create a new message
const createMessage = async ({
  chatId,
  senderId,
  receiverId,
  messageType,
  content,
  files,
}) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new CustomError("Chat not found.", 404);
  }

  const participants = chat.participants.map((id) => id.toString());
  if (!participants.includes(senderId) || !participants.includes(receiverId)) {
    throw new CustomError("Sender or receiver is not part of this chat.", 403);
  }

  let newMessage;
  if (messageType === "media") {
    if (!files || files.length === 0) {
      throw new CustomError(
        "Media files are required for media messages.",
        400
      );
    }

    newMessage = new Message({
      chatId,
      senderId,
      receiverId,
      messageType: "media",
      content: content || null,
      files,
      timestamp: Date.now(),
    });
  } else if (messageType === "text") {
    if (!content) {
      throw new CustomError("Text content is required for text messages.", 400);
    }

    newMessage = new Message({
      chatId,
      senderId,
      receiverId,
      messageType: "text",
      content,
      timestamp: Date.now(),
    });
  } else {
    throw new CustomError(
      "Invalid message type or missing required fields.",
      400
    );
  }

  await newMessage.save();

  // Update the chat's last message
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: newMessage._id,
    updatedAt: Date.now(),
  });

  return newMessage;
};

// Get undelivered messages
const getUndeliveredMessages = async (receiverId) => {
  return await Message.find({ receiverId, delivered: false });
};

const deleteMediaFile = async (fileUrl) => {
  try {
    if (!fileUrl || typeof fileUrl !== "string") {
      throw new CustomError("Invalid file URL provided", 400);
    }

    const deleteResult = ContaboService.deleteFile(fileUrl);

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error in deleteMediaFile:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Fetches all messages for a chat with pagination.
 * @param {String} chatId - The ID of the chat.
 * @param {Number} page - The current page.
 * @param {Number} limit - The number of messages per page.
 * @returns {Object} - Paginated list of messages and total count.
 */
const fetchAllMessages = async (chatId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Verify if the chatId exists
  const chatExists = await Chat.findById(chatId);
  if (!chatExists) {
    throw new CustomError("Chat not found", 404);
  }

  // Fetch messages with pagination
  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 }) // Order by newest first
    .skip(skip)
    .limit(limit);
  // .populate('senderId', 'userName email'); // Populate sender details

  // Get the total count of messages for the chat
  const totalMessages = await Message.countDocuments({ chatId });

  return {
    messages,
    totalMessages,
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
  };
};

/**
 * Updates a message with the given ID and update data.
 * @param {String} messageId - The ID of the message to update.
 * @param {Object} updateData - An object containing the fields to update.
 * @returns {Promise<Object>} - The updated message document.
 */
// const updateMessage = async (messageId, updateData) => {
//   try {
//     // Validate that the message exists
//     const message = await Message.findById(messageId);
//     if (!message) {
//       throw new CustomError("Message not found.", 404);
//     }

//     // Update the message fields
//     const updatedMessage = await Message.findByIdAndUpdate(
//       messageId,
//       { $set: updateData },
//       { new: true, runValidators: true } // Return the updated document and run schema validators
//     );

//     return updatedMessage;
//   } catch (error) {
//     // Re-throw the error for centralized error handling
//     throw new CustomError(error.message, error.statusCode || 500);
//   }
// };

const updateMessage = async (messageId, updateData) => {
  try {
    // Validate that the message exists
    const message = await Message.findById(messageId);
    if (!message) {
      throw new CustomError("Message not found.", 404);
    }

    // Update the message fields with the provided operations
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      updateData, // Allow full flexibility of update operations
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    return updatedMessage;
  } catch (error) {
    // Re-throw the error for centralized error handling
    throw new CustomError(error.message, error.statusCode || 500);
  }
};

module.exports = {
  handleUploadedFiles,
  createMessage,
  getUndeliveredMessages,
  deleteMediaFile,
  fetchAllMessages,
  updateMessage,
};
