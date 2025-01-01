const express = require("express");
const { saveFcmTokenController } = require("../controller/FCMManagementController");
const router = express.Router();

router.post("/save-fcm-token", saveFcmTokenController);

module.exports = router;
