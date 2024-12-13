const express = require('express');
const router = express.Router();
const upload = require('../middleware/file-upload'); 
const {newMessage,uploadFiles,deleteUploadedFiles}=require('../controller/messageManagementController')
const { auth, authorizeRoles } = require('../middleware/authentication');

router.post('/uploadMessageFiles', upload.array('media'), uploadFiles); 
router.post('/createMessage', upload.array('files', 5), newMessage);
router.delete('/deleteUploadedFiles', deleteUploadedFiles);


module.exports = router;