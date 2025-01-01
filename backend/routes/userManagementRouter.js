const express = require('express');
const router = express.Router();
const upload = require('../middleware/user-profile-file-upload'); 


const { createUserController, getAllUsersController,loginController, forgotPassword, resetPassword, verifyEmailCodeController, resendVerificationCode ,updateUserProfileController} = require('../controller/userManagementController');
const { auth, authorizeRoles } = require('../middleware/authentication');

router.post('/createUser', createUserController);
router.post('/login', loginController);
router.post('/forgotPassword', forgotPassword);
router.put('/resetPassword/:resetToken', resetPassword);
router.post('/verifyEmailCode', verifyEmailCodeController);
router.post('/resendVerificationCode', resendVerificationCode);
router.patch('/update-profile/:userId', upload.single('profileImage'), updateUserProfileController);

// Route to fetch all users
router.get(
    "/getAllUsers",getAllUsersController);

module.exports = router;