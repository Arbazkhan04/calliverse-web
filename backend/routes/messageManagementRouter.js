const express = require('express');
const router = express.Router();
const upload = require('../middleware/file-upload'); 
const {newMessage,uploadFiles,deleteUploadedFiles,fetchAllMessagesController,updateMessageController}=require('../controller/messageManagementController')
const { auth, authorizeRoles } = require('../middleware/authentication');
const validateRequest = require("../middleware/validateRequests");
const {getAllChatMessagesSchema} = require("../DTO/MessageDTO")

router.post('/uploadMessageFiles', upload.array('media'), uploadFiles); 
router.post('/createMessage', upload.array('files', 5), newMessage);
router.delete('/deleteUploadedFiles', deleteUploadedFiles);
router.get('/fetchAllChatMessages/:chatId',validateRequest(getAllChatMessagesSchema), fetchAllMessagesController); 
router.patch("/updateMessage/:messageId", updateMessageController);

module.exports = router;