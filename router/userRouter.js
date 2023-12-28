
// const account=require('../mongodb');
// const { rename } = require('fs');
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController/userSignup');
const userController2 = require('../controller/userController/userlogin');

// const userOtpVerification = require('../controller/userController/userSignup');

const session=require('express-session')



router.use((req, res, next) => {
     res.header("Cache-Control", "no-cache, private, no-store, must-revalidate,") // max-stale=0, post-check=0, pre-check=0" );
    next();
});

router.use(session({
    secret:"secretqwerty",
    resave:false,
    saveUninitialized:true
}))



// userRouter.js


// Route for getting the login page
router.get('/',userController2.isUserBlocked ,userController.home);
router.get('/loginpage',userController.userlogin)
router.get('/signuppage',userController.userSignupGet)
router.post('/signup',userController.userSignupPost)
router.post('/signin',userController2.userSignIn)// Post
router.get('/logout',userController2.userlogout)



router.post('/otpverified',userController.otpVerificationPost)

router.get('/otpPage',userController.otpPage)
router.get('/homewithUser',userController.homeWithUser)
module.exports = router;











