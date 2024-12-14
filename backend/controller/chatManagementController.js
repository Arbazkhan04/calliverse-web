const CustomError = require("../utils/customError.js");
const responseHandler = require("../utils/responseHandler.js");
const Chat = require("../modals/chatManagementModel.js");
const {fetchAllChats} = require("../services/chatManagementService.js")
const createChat = async (req, res, next) => {
  try {
    const participants = req.body?.participants;
    const userAId = participants[0];
    const userBId = participants[1];

    // Validation: Ensure two unique participants
    if (userAId === userBId) {
      return responseHandler(res, 400, "A user cannot chat with themselves.");
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [userAId, userBId] },
    });

    if (existingChat) {
      return responseHandler(
        res,
        200,
        "Chat found successfully.",
        existingChat
      );
    }

    // Create a new chat instance
    const newChat = new Chat({
      participants: [userAId, userBId],
    });

    // Save the new chat to the database
    await newChat.save();

    return responseHandler(res, 201, "Chat created successfully.", newChat);
  } catch (error) {
    next(error instanceof CustomError ? error : new CustomError(error.message, 500));
  }
};

const fetchAllChatsController = async (req, res, next) => {
  try {
    // const userId = req.params.userId;
    // const { page = 1, limit = 20 } = req.query;

    const { userId, page, limit } = req.validatedData;

    // Call service to fetch chats
    const result = await fetchAllChats(userId, parseInt(page, 10), parseInt(limit, 10));

    // Return success response
    responseHandler(res, 200, 'Chats fetched successfully.', result);
  } catch (error) {
    next(
      error instanceof CustomError ? error : new CustomError(error.message, 500)

    );
  }
};

module.exports = {
  createChat,
  fetchAllChatsController
};
