const mongoose = require("mongoose");
const CustomError = require("../utils/customError.js");
const { validateIds } = require("../utils/referenceIdsValidator.js");
const User = require("../modals/userManagementModal"); // Import the User model

const oneToOneChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async function (ids) {
            await validateIds(ids, "User");
          },
          message: "Invalid participants.",
        },
        required: [true,"field is required"],
      },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

oneToOneChatSchema.pre("save", async function (next) {
  try {
    const participants = this.participants;

    // Ensure exactly two participants
    if (participants.length !== 2) {
      return next(
        new CustomError("Chat must have exactly two participants.", 400)
      );
    }

    // // Check if all participants exist in the User collection
    // const users = await User.find({ _id: { $in: participants } });
    // if (users.length !== participants.length) {
    //   return next(new CustomError("One or more participant IDs are invalid.", 400));
    // }

    next(); // Validation passed, proceed to save
  } catch (error) {
    next(error); // Pass error to Mongoose and the controller
  }
});


module.exports = mongoose.model("Chat", oneToOneChatSchema);
