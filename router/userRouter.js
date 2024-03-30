

const express = require('express');
const router = express.Router();



const userSessionHandling=require('../middleware/userSessionHandling')


const userManagement=require('../controller/userManagement')  
router.get('/' ,  userSessionHandling.isBlockedNow,userManagement.home)




router.get('/loginpage',userSessionHandling.requireNotUser,userManagement.userLogin)  // first
router.post('/login',userManagement.userLoginPost)
router.get('/signuppage',userSessionHandling.requireNotUser,userManagement.userSignupGet)
router.post('/signup',userManagement.userSignupPost)
router.get('/otpPage',  userSessionHandling.otpSession , userManagement.otpPage)
router.post('/otpverified',  userSessionHandling.requireNotUser  ,  userManagement.otpVerificationPost)
router.get('/resendOtp', userSessionHandling.otpSession,userManagement.otpPage)
router.get('/logout',userManagement.logout)
// router.get('/userProfile',userSessionHandling.userlogged, userManagement.userProfile)
router.get('/userProfile',userSessionHandling.isBlockedNow2, userManagement.userProfile)
router.get('/userAddAddress',   userSessionHandling.isBlockedNow2,userManagement.userAddAddress )
router.post('/editAddress',   userSessionHandling.isBlockedNow2,userManagement.editAddress )
router.get('/orderStatus',    userSessionHandling.isBlockedNow2,userManagement.userOrderStatus)




router.get('/changePassword',(req,res,next)=>{
    req.session.changePassword =true
    next()
},
userSessionHandling.isBlockedNow2,userManagement.updatePassword)
router.get('/forgotPassword',    userSessionHandling.isBlockedNow2,userManagement.updatePassword)
router.post('/update-password',    userManagement.updatePasswordPost)

router.post('/updateUserName',    userManagement.changeName)



const productManagement=require('../controller/productManagement')


router.get('/category/:id',   userSessionHandling.isBlockedNow,    productManagement.productListUser)
router.post('/category/fetch/:id', userSessionHandling.isBlockedNow,    productManagement.fetchData)
router.post('/category/:id/ascending/',userSessionHandling.isBlockedNow,productManagement.priceSortDescending)
router.post('/category/:id/descending',userSessionHandling.isBlockedNow,productManagement.priceSortAscending)
router.post('/category/:id/searchProduct',userSessionHandling.isBlockedNow,productManagement.searchProduct)



router.get('/productdetails/:id',  userSessionHandling.isBlockedNow,  productManagement.productDetail)




router.get('/wallet', userSessionHandling.isBlockedNow2,userManagement.wallet)

const couponManagement = require('../controller/couponController.js')
router.get('/availableCoupons', userSessionHandling.isBlockedNow2,couponManagement.availableCoupon)




const invoiceController = require('../controller/invoiceController.js')



router.get('/download-invoice/:orderId',userSessionHandling.isBlockedNow2,invoiceController.downloadInvoice)






module.exports = router;











