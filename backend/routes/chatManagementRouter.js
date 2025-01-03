const express = require("express");
const router = express.Router();
const { createChat,fetchAllChatsController } = require("../controller/chatManagementController");
const { auth, authorizeRoles } = require("../middleware/authentication");
const validateRequest = require("../middleware/validateRequests");
const {getAllChatsSchema} = require("../DTO/ChatDTO")
router.post("/createChat", createChat);
router.get('/fetchAllChats/:userId',validateRequest(getAllChatsSchema), fetchAllChatsController); 

module.exports = router;
