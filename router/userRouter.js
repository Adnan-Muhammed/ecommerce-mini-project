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
router.get('/signuppage',userSessionHandling.requireNotUser,userManagement.userSignupGet)
router.post('/signup',userManagement.userSignupPost)
router.get('/otpPage', userSessionHandling.otpSession , userManagement.otpPage)
router.post('/otpverified',  userSessionHandling.requireNotUser  , userManagement.otpVerificationPost)
router.get('/resendOtp',userSessionHandling.otpSession,userManagement.resendOtp)
router.get('/logout',userManagement.logout)







const productManagement=require('../controller/productManagement')
router.get('/category/:id',userSessionHandling.isBlockedNow,    productManagement.productListUser)
router.get('/productdetails/:id', userSessionHandling.isBlockedNow,  productManagement.productDetail)




// router.post('/priceSort',(req,res)=>{
//     console.log(req.body.pricing)
// })

// router.post('/category/:id/descending',(req,res)=>{
//     console.log(7777111);
//     console.log('descending');
//     console.log(req.body.priceValue);
// })

// router.post('/category/:id/ascending',(req,res)=>{
//     console.log(777711);
//     console.log('ascending');
//     console.log(req.body.priceValue);
// })

router.post('/category/:id/ascending',userSessionHandling.isBlockedNow,productManagement.priceSortAscending)
router.post('/category/:id/descending',userSessionHandling.isBlockedNow,productManagement.priceSortDescending)



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











