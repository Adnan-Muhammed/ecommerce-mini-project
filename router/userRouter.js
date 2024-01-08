const express = require('express');
const router = express.Router();




// userRouter.js
//new 
const userSessionHandling=require('../middleware/userSessionHandling')


const userManagement=require('../controller/userManagement')
// its working perfect-=-=-=-=-=-=-
router.get('/' ,userSessionHandling.isBlockedNow,userManagement.home)
router.get('/loginpage',userSessionHandling.requireNotUser,userManagement.userLogin)  // first
router.post('/login',userManagement.userLoginPost)
router.post('/signup',userManagement.userSignupPost)
router.get('/signuppage',userSessionHandling.requireNotUser,userManagement.userSignupGet)
router.get('/otpPage', userSessionHandling.requireNotUser , userManagement.otpPage)
router.post('/otpverified',  userSessionHandling.requireNotUser  , userManagement.otpVerificationPost)
router.get('/resendOtp',userSessionHandling.requireNotUser,userManagement.resendOtp)
router.get('/logout',userManagement.logout)








const productManagement=require('../controller/productManagement')
router.get('/product',productManagement.userSideProductlist)
router.get('/productDetail',productManagement.userSideproductDetails)
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











