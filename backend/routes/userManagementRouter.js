const express = require('express');
const router = express.Router();
const { handleFileUpload } = require('../middleware/files-upload-middleware'); // Assuming file-upload now includes the Contabo integration


const { createUserController, getAllUsersController,loginController, forgotPassword, resetPassword, verifyEmailCodeController, resendVerificationCode ,updateUserProfileController} = require('../controller/userManagementController');
const { auth, authorizeRoles } = require('../middleware/authentication');

router.post('/createUser', createUserController);
router.post('/login', loginController);
router.post('/forgotPassword', forgotPassword);
router.put('/resetPassword/:resetToken', resetPassword);
router.post('/verifyEmailCode', verifyEmailCodeController);
router.post('/resendVerificationCode', resendVerificationCode);



// Define the fields expected 
const uploadFields = [
    { name: 'profileImage', maxCount: 1 }, // Adjust 'maxCount' as needed
  ];
  const targetFolder = 'user-Profile-Images'; // Define the target folder in Contabo bucket
  
router.patch('/update-profile/:userId',handleFileUpload(uploadFields, targetFolder), updateUserProfileController);
// router.post('/uploadMessageFiles', handleFileUpload(uploadFields, targetFolder), uploadFiles);

// Route to fetch all users
router.get(
    "/getAllUsers",getAllUsersController);

module.exports = router;