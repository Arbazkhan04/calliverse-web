const Chat = require('../modals/chatManagementModel');
const User = require('../modals/userManagementModal')
/**
 * Fetches all chats where the user is a participant with pagination.
 * @param {String} userId - The ID of the user.
 * @param {Number} page - The current page.
 * @param {Number} limit - The number of chats per page.
 * @returns {Object} - Paginated list of chats and total count.
 */
// const fetchAllChats = async (userId, page = 1, limit = 20) => {
//     const skip = (page - 1) * limit;
//   console.log("user Id for chat",userId)

//   const userExist= await User.findById(userId)

//   if(!userExist){
//     throw new CustomError('User not found', 404);

//   }
//     // Fetch chats with pagination
//     const chats = await Chat.find({ participants: userId })
//       .sort({ updatedAt: -1 }) // Order by latest activity
//       .skip(skip)
//       .limit(limit)
//       .populate('lastMessage') // Populate last message details
//       .populate('participants', '_id userName email firstName lastName profileImage'); // Populate participant details
  
//     // Get the total count of chats for the user
//     const totalChats = await Chat.countDocuments({ participants: userId });
  
//     return {
//       chats,
//       totalChats,
//       currentPage: page,
//       totalPages: Math.ceil(totalChats / limit),
//     };
//   };







// const fetchAllChats = async (userId, page = 1, limit = 20) => {
//   const skip = (page - 1) * limit;

//   console.log("User ID for chat:", userId);

//   // Check if user exists
//   const userExist = await User.findById(userId);
//   if (!userExist) {
//     throw new CustomError('User not found', 404);
//   }

//   // Fetch chats with pagination
//   const chats = await Chat.find({ participants: userId })
//     .sort({ updatedAt: -1 }) // Order by latest activity
//     .skip(skip)
//     .limit(limit)
//     .populate('lastMessage') // Populate last message details
//     .populate('participants', '_id userName email firstName lastName profileImageUrl'); // Populate participant details

//   // Adjust lastMessage to null if empty or invalid
//   const adjustedChats = chats.map(chat => {
//     console.log(chat.profileImageUrl)
//     if (!chat.lastMessage || Object.keys(chat.lastMessage).length === 0) {
//       chat.lastMessage = null; // Explicitly set to null
//     }
//     return chat;
//   });

//   // Get the total count of chats for the user
//   const totalChats = await Chat.countDocuments({ participants: userId });

//   return {
//     chats: adjustedChats, // Return adjusted chats
//     totalChats,
//     currentPage: page,
//     totalPages: Math.ceil(totalChats / limit),
//   };
// };






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


module.exports = { fetchAllChats };
