const Chat = require('../modals/chatManagementModel');
const User = require('../modals/userManagementModal')
const CustomError = require("../utils/customError");

/**
 * Fetches all chats where the user is a participant with pagination.
 * @param {String} userId - The ID of the user.
 * @param {Number} page - The current page.
 * @param {Number} limit - The number of chats per page.
 * @returns {Object} - Paginated list of chats and total count.
 */


/**
 * Creates a new chat or retrieves an existing one.
 * @param {Array} participants - Array of participant IDs (2 participants).
 * @returns {Object} - Newly created or existing chat in the required response structure.
 */
const createChatService = async (participants) => {
  if (!participants || participants.length !== 2) {
    throw new CustomError('Two participants are required.', 400);
  }

  const [userAId, userBId] = participants;

  if (userAId === userBId) {
    throw new CustomError('A user cannot chat with themselves.', 400);
  }

  // Validate both participants exist
  const users = await User.find({ _id: { $in: [userAId, userBId] } });
  if (users.length !== 2) {
    throw new CustomError('One or more participants are invalid.', 400);
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    participants: { $all: [userAId, userBId] },
  })
    .populate('lastMessage')
    .populate('participants', '_id userName email firstName lastName profileImage');

  if (chat) {
    // Transform participants to include `profileImage` as a string
    const transformedParticipants = chat.participants.map(participant => ({
      _id: participant._id,
      userName: participant.userName,
      email: participant.email,
      firstName: participant.firstName,
      lastName: participant.lastName,
      profileImage: participant.profileImage?.imageUrl || null,
    }));

    return {
      ...chat.toObject(),
      participants: transformedParticipants,
    };
  }

  // Create a new chat instance
  chat = new Chat({
    participants: [userAId, userBId],
  });

  // Save the new chat to the database
  await chat.save();

  // Populate and transform the response
  const savedChat = await Chat.findById(chat._id)
    .populate('lastMessage')
    .populate('participants', '_id userName email firstName lastName profileImage');

  const transformedParticipants = savedChat.participants.map(participant => ({
    _id: participant._id,
    userName: participant.userName,
    email: participant.email,
    firstName: participant.firstName,
    lastName: participant.lastName,
    profileImage: participant.profileImage?.imageUrl || null,
  }));

  return {
    ...savedChat.toObject(),
    participants: transformedParticipants,
  };
};



//fetch all chats of a user

const fetchAllChats = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  console.log("User ID for chat:", userId);

  // Check if user exists
  const userExist = await User.findById(userId);
  if (!userExist) {
    throw new CustomError('User not found', 404);
  }

  // Fetch chats with pagination
  const chats = await Chat.find({ participants: userId })
    .sort({ updatedAt: -1 }) // Order by latest activity
    .skip(skip)
    .limit(limit)
    .populate('lastMessage') // Populate last message details
    .populate('participants', '_id userName email firstName lastName profileImage'); // Populate participant details

  // Transform chats and participants
  const adjustedChats = chats.map(chat => {
    // Transform participants to include profileImage as a string
    const transformedParticipants = chat.participants.map(participant => ({
      _id: participant._id,
      userName: participant.userName,
      email: participant.email,
      firstName: participant.firstName,
      lastName: participant.lastName,
      profileImage: participant.profileImage?.imageUrl || null, // Extract imageUrl
    }));

    // Adjust lastMessage to null if empty or invalid
    if (!chat.lastMessage || Object.keys(chat.lastMessage).length === 0) {
      chat.lastMessage = null; // Explicitly set to null
    }

    return {
      ...chat.toObject(), // Convert to plain object
      participants: transformedParticipants, // Replace participants with transformed data
    };
  });

  // Get the total count of chats for the user
  const totalChats = await Chat.countDocuments({ participants: userId });

  return {
    chats: adjustedChats, // Return adjusted chats
    totalChats,
    currentPage: page,
    totalPages: Math.ceil(totalChats / limit),
  };
};


module.exports = { fetchAllChats ,createChatService};
