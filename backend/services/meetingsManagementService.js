const Meeting = require("../modals/meetingManagementModel");
const CustomError = require("../utils/customError");

class MeetingService {
  /**
   * Create a new meeting.
   * @param {Object} meetingData - Data for the new meeting.
   * @returns {Object} - Newly created meeting.
   */
  static async createMeeting(meetingData) {
    if (!meetingData || !meetingData.meetingId || !meetingData.host) {
      throw new CustomError("Meeting ID and host are required.", 400);
    }

    const newMeeting = new Meeting(meetingData);
    await newMeeting.save();
    return newMeeting;
  }

  /**
   * Fetch a meeting by its ID.
   * @param {String} meetingId - Unique ID of the meeting.
   * @returns {Object} - Meeting details.
   */
  static async getMeetingById(meetingId) {
    if (!meetingId) {
      throw new CustomError("Meeting ID is required.", 400);
    }

    const meeting = await Meeting.findOne({ meetingId }).populate("host participants.userId", "_id userName email");
    if (!meeting) {
      throw new CustomError("Meeting not found.", 404);
    }

    return meeting;
  }

  /**
   * Update a meeting by its ID.
   * @param {String} meetingId - Unique ID of the meeting.
   * @param {Object} updateData - Fields to update.
   * @returns {Object} - Updated meeting.
   */
  static async updateMeeting(meetingId, updateData) {
    if (!meetingId || !updateData) {
      throw new CustomError("Meeting ID and update data are required.", 400);
    }

    const updatedMeeting = await Meeting.findOneAndUpdate({ meetingId }, updateData, { new: true });
    if (!updatedMeeting) {
      throw new CustomError("Meeting not found.", 404);
    }

    return updatedMeeting;
  }

  /**
   * Delete a meeting by its ID.
   * @param {String} meetingId - Unique ID of the meeting.
   * @returns {Object} - Deleted meeting.
   */
  static async deleteMeeting(meetingId) {
    if (!meetingId) {
      throw new CustomError("Meeting ID is required.", 400);
    }

    const deletedMeeting = await Meeting.findOneAndDelete({ meetingId });
    if (!deletedMeeting) {
      throw new CustomError("Meeting not found.", 404);
    }

    return deletedMeeting;
  }

  /**
   * Add a participant to a meeting.
   * @param {String} meetingId - Unique ID of the meeting.
   * @param {Object} participantData - Data of the participant to add.
   * @returns {Object} - Updated meeting.
   */
  static async addParticipant(meetingId, participantData) {
    if (!meetingId || !participantData || !participantData.userId) {
      throw new CustomError("Meeting ID and participant data are required.", 400);
    }

    const meeting = await Meeting.findOneAndUpdate(
      { meetingId },
      { $addToSet: { participants: participantData } },
      { new: true }
    );
    if (!meeting) {
      throw new CustomError("Meeting not found.", 404);
    }

    return meeting;
  }

  /**
   * Remove a participant from a meeting.
   * @param {String} meetingId - Unique ID of the meeting.
   * @param {String} userId - ID of the participant to remove.
   * @returns {Object} - Updated meeting.
   */
  static async removeParticipant(meetingId, userId) {
    if (!meetingId || !userId) {
      throw new CustomError("Meeting ID and user ID are required.", 400);
    }

    const meeting = await Meeting.findOneAndUpdate(
      { meetingId },
      { $pull: { participants: { userId } } },
      { new: true }
    );
    if (!meeting) {
      throw new CustomError("Meeting not found.", 404);
    }

    return meeting;
  }
}

module.exports = MeetingService;
