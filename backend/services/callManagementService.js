const Call = require("../modals/callManagementModel");
const CustomError = require("../utils/customError");

/**
 * Call Service Class
 * Provides methods to handle call-related operations.
 */
class CallService {
  /**
   * Creates a new call.
   * @param {Object} callData - Data for the new call.
   * @returns {Object} - Newly created call.
   */
  static async createCall(callData) {
    if (!callData || !callData.callId || !callData.participants || callData.participants.length !== 2) {
      throw new CustomError("Invalid call data. Two participants and a unique callId are required.", 400);
    }

    const { participants } = callData;
    if (participants[0] === participants[1]) {
      throw new CustomError("A user cannot call themselves.", 400);
    }

    const newCall = new Call(callData);
    await newCall.save();
    return newCall;
  }

  /**
   * Updates a call document by callId.
   * @param {String} callId - Unique ID of the call to update.
   * @param {Object} updateData - Fields to update in the call.
   * @returns {Object} - Updated call document.
   */
  static async updateCall(callId, updateData) {
    if (!callId || !updateData) {
      throw new CustomError("Call ID and update data are required.", 400);
    }

   
   
    const updatedCall = await Call.findOneAndUpdate({ callId }, updateData, { new: true });
    console.log("updated Call",updatedCall)
    if (!updatedCall) {
      throw new CustomError("Call not found.", 404);
    }

    return updatedCall;
  }

  /**
   * Deletes a call for a specific user by marking it as archived for the user.
   * @param {String} callId - Unique ID of the call.
   * @param {String} userId - ID of the user who wants to archive the call.
   * @returns {Object} - Updated call document.
   */
  static async deleteCallForUser(callId, userId) {
    if (!callId || !userId) {
      throw new CustomError("Call ID and User ID are required.", 400);
    }

    const updatedCall = await Call.findOneAndUpdate(
      { callId },
      { $addToSet: { archived: userId } }, // Add userId to the archived array if not already present
      { new: true }
    );

    if (!updatedCall) {
      throw new CustomError("Call not found.", 404);
    }

    return updatedCall;
  }

  /**
   * Fetches all calls where a user is a participant and not archived by them.
   * @param {String} userId - User ID to filter calls.
   * @param {Number} page - Current page for pagination.
   * @param {Number} limit - Number of calls per page.
   * @returns {Object} - Paginated list of calls and total count.
   */
  static async getCallsByUser(userId, page = 1, limit = 20) {
    if (!userId) {
      throw new CustomError("User ID is required.", 400);
    }

    const skip = (page - 1) * limit;

    // Fetch calls with pagination
    const calls = await Call.find({ participants: userId, archived: { $ne: userId } })
      .sort({ updatedAt: -1 }) // Order by latest activity
      .skip(skip)
      .limit(limit)
      .populate("participants", "_id userName email profileImage");

    const totalCalls = await Call.countDocuments({ participants: userId, archived: { $ne: userId } });

    return {
      calls,
      totalCalls,
      currentPage: page,
      totalPages: Math.ceil(totalCalls / limit),
    };
  }

  /**
   * Fetches a single call by callId.
   * @param {String} callId - Unique ID of the call.
   * @returns {Object} - Call document.
   */
  static async getCallByCallId(callId) {
    if (!callId) {
      throw new CustomError("Call ID is required.", 400);
    }

    const call = await Call.findOne({ callId }).select("participants initiatedAt callId status callType");
    if (!call) {
      throw new CustomError("Call not found.", 404);
    }

    return call;
  }
}

module.exports = CallService;
