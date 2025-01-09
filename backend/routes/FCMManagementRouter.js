const express = require("express");
const { saveFcmTokenController,sendNotificationController } = require("../controller/FCMManagementController");
const router = express.Router();

router.post("/save-fcm-token", saveFcmTokenController);
// POST /api/notifications/send
router.post("/test-send-notification",  sendNotificationController);
module.exports = router;
