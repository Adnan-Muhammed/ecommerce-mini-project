

const express = require('express');
const router = express.Router();



const userSessionHandling=require('../middleware/userSessionHandling')


const userManagement=require('../controller/userManagement')  
router.get('/' ,userSessionHandling.isBlockedNow,userManagement.home)
router.get('/loginpage',userSessionHandling.requireNotUser,userManagement.userLogin)  // first
router.post('/login',userManagement.userLoginPost)
router.get('/signuppage',userSessionHandling.requireNotUser,userManagement.userSignupGet)
router.post('/signup',userManagement.userSignupPost)
router.get('/otpPage',  userSessionHandling.otpSession , userManagement.otpPage)
router.post('/otpverified',  userSessionHandling.requireNotUser  ,  userManagement.otpVerificationPost)
router.get('/resendOtp', userSessionHandling.otpSession,userManagement.otpPage)
router.get('/logout',userManagement.logout)


router.get('/userProfile',userSessionHandling.userlogged, userManagement.userProfile)
router.get('/userAddAddress',   userSessionHandling.userlogged,userManagement.userAddAddress )
router.post('/editAddress',   userSessionHandling.userlogged,userManagement.editAddress )

router.get('/orderStatus',    userSessionHandling.userlogged,userManagement.userOrderStatus)




router.get('/changePassword',(req,res,next)=>{
    req.session.changePassword =true
    next()
},
userSessionHandling.userlogged,userManagement.updatePassword)
router.get('/forgotPassword',    userSessionHandling.passwordUpdation,userManagement.updatePassword)
router.post('/update-password',    userManagement.updatePasswordPost)

router.post('/updateUserName',    userManagement.changeName)



const productManagement=require('../controller/productManagement')


router.get('/category/:id',   userSessionHandling.isBlockedNow,    productManagement.productListUser)
router.post('/category/fetch/:id', userSessionHandling.isBlockedNow,    productManagement.fetchData)
router.post('/category/:id/ascending/',userSessionHandling.isBlockedNow,productManagement.priceSortDescending)
router.post('/category/:id/descending',userSessionHandling.isBlockedNow,productManagement.priceSortAscending)
router.post('/category/:id/searchProduct',userSessionHandling.isBlockedNow,productManagement.searchProduct)



router.get('/productdetails/:id',  userSessionHandling.isBlockedNow,  productManagement.productDetail)




router.get('/wallet', userSessionHandling.isBlockedNow,userManagement.wallet)

const couponManagement = require('../controller/couponController.js')
router.get('/availableCoupons', userSessionHandling.isBlockedNow,couponManagement.availableCoupon)


// router.get('/editUserName', userSessionHandling.isBlockedNow,userManagement.changeName)













router.get('/aaa',(req,res)=>{
    res.render('user/zooming')
})
router.get('/myprofile',(req,res)=>{
    res.render('user/profile')
})

router.get('/myprofile/wallet',(req,res)=>{
    res.render('user/wallet')
})


router.get('/place-order',(req,res)=>{
    res.render('user/orderPlaced')
})




module.exports = router;











