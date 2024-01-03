// const account=require('../mongodb');
// const { rename } = require('fs');
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController/userSignup');
const userController2 = require('../controller/userController/userlogin');

// const userOtpVerification = require('../controller/userController/userSignup');

const session=require('express-session');



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


//new 
const userSessionHandling=require('../middleware/userSessionHandling')
const userManagement=require('../controller/userManagement')

// its working perfect-=-=-=-=-=-=-
router.get('/' ,userSessionHandling.isBlockedNow,userManagement.home)
// its working perfect-=-=-=-=-=-=-


// its working perfect-=-=-=-=-=-=-
router.get('/loginpage',userSessionHandling.requireNotUser,userManagement.userLogin)  // first
router.post('/login',userManagement.userLoginPost)
// its working perfect-=-=-=-=-=-=-




//next 
router.get('/logout',userManagement.logout)

router.post('/signup',userManagement.userSignupPost)

router.get('/signuppage',userSessionHandling.requireNotUser,userManagement.userSignupGet)
router.get('/otpPage', userSessionHandling.requireNotUser , userManagement.otpPage)
router.post('/otpverified',  userSessionHandling.requireNotUser  , userManagement.otpVerificationPost)
router.get('/resendOtp',userSessionHandling.requireNotUser,userManagement.resendOtp)

// gpt
// router.post('/otpverified', userController.verifyOTP);















// Route for getting the login page
// router.get('/',userController2.isUserBlocked ,userController.home);
// router.get('/loginpage',userController.userlogin)
// router.get('/signuppage',userController.userSignupGet)
// router.post('/signup',userController.userSignupPost)
// router.post('/signin',userController2.userSignIn)// Post
// router.get('/logout',userController2.userlogout)



// router.post('/otpverified',userController.otpVerificationPost)

// router.get('/otpPage',userController.otpPage)
// router.get('/resendOtp',userController.resendOtp)
// router.get('/homewithUser',userController.homeWithUser)



router.get('/MenCollection',userController2.userProductlist)
router.get('/productDetail',userController2.userproductDetails)
router.get('/aaa',(req,res)=>{
    res.render('user/aaa')
})
router.get('/cart',(req,res)=>{
    res.render('user/cart')
})
router.get('/checkout',(req,res)=>{
    res.render('user/checkout')
})

module.exports = router;











