const express = require('express');
const router = express.Router();
const upload = require('../middleware/file-upload'); 
const {newMessage,uploadFiles,deleteUploadedFiles,fetchAllMessagesController,updateMessageController}=require('../controller/messageManagementController')
const { auth, authorizeRoles } = require('../middleware/authentication');
const validateRequest = require("../middleware/validateRequests");
const {getAllChatMessagesSchema} = require("../DTO/MessageDTO")
const { handleFileUpload } = require('../middleware/files-upload-middleware'); // Assuming file-upload now includes the Contabo integration




// Define the fields expected in the 'uploadMessageFiles' route
const uploadFields = [
    { name: 'media', maxCount: 10 }, // Adjust 'maxCount' as needed
  ];
  const targetFolder = 'media'; // Define the target folder in Contabo bucket
  
  // Use Contabo middleware in the uploadMessageFiles route
  router.post('/uploadMessageFiles', handleFileUpload(uploadFields, targetFolder), uploadFiles);
  



// router.post('/uploadMessageFiles', upload.array('media'), uploadFiles); 
router.post('/createMessage', upload.array('files', 5), newMessage);
router.delete('/deleteUploadedFiles', deleteUploadedFiles);
router.get('/fetchAllChatMessages/:chatId',validateRequest(getAllChatMessagesSchema), fetchAllMessagesController); 
router.patch("/updateMessage/:messageId", updateMessageController);

module.exports = router;