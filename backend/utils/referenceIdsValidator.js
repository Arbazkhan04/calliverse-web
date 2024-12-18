const mongoose = require("mongoose");
const CustomError = require("./customError");

/**
 * Validates if the provided IDs have a valid ObjectId format.
 * Supports both single ID strings and arrays of IDs.
 * @param {String|Array} ids - A single ID or an array of IDs to validate.
 * @returns {Object} - An object with isValid and invalidIds.
 */
const validateObjectIds = (ids) => {
  // Normalize to an array
  const idsArray = Array.isArray(ids) ? ids : [ids];

  const invalidIds = idsArray.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  return {
    isValid: invalidIds.length === 0,
    invalidIds,
  };
};

/**
 * Validates if the provided IDs exist in the specified model.
 * Supports both single ID strings and arrays of IDs.
 * @param {String|Array} ids - A single ID or an array of IDs to validate.
 * @param {String} modelName - Name of the Mongoose model to check.
 * @returns {Object} - An object with isValid and missingIds.
 */
const validateIdsExist = async (ids, modelName) => {
  // Normalize to an array
  const idsArray = Array.isArray(ids) ? ids : [ids];

  const Model = mongoose.model(modelName);
  const existingDocuments = await Model.find({ _id: { $in: idsArray } });
  const existingIds = existingDocuments.map((doc) => doc._id.toString());

  const missingIds = idsArray.filter((id) => !existingIds.includes(id.toString()));
  return {
    isValid: missingIds.length === 0,
    missingIds,
  };
};

/**
 * Comprehensive validation for IDs.
 * Combines format and existence checks.
 * Supports both single ID strings and arrays of IDs.
 * @param {String|Array} ids - A single ID or an array of IDs to validate.
 * @param {String} modelName - Name of the Mongoose model to check.
 * @returns {Promise<void>} - Throws an error if validation fails.
 */
const validateIds = async (ids, modelName) => {
    // Step 1: Validate ObjectId format
    const { isValid: areValidIds, invalidIds } = validateObjectIds(ids);
    if (!areValidIds) {
      throw new CustomError(
        `Invalid ID format(s): ${invalidIds.join(", ")}`,
        400 // Bad Request
      );
    }
  
    // Step 2: Validate existence in the database
    const { isValid: exist, missingIds } = await validateIdsExist(ids, modelName);
    if (!exist) {
      throw new CustomError(
        `${modelName} not exist : ${missingIds.join(", ")}`,
        404 // Not Found
      );
    }
  };

module.exports = {
  validateObjectIds,
  validateIdsExist,
  validateIds,
};
