const express = require('express');
const router = express.Router();

const checkoutManagement = require('../controller/checkoutManagement')


const userSessionHandling=require('../middleware/userSessionHandling')

router.get('/checkout', userSessionHandling.isBlockedNow,checkoutManagement.checkoutPage)



router.post('/address-added',  userSessionHandling.isBlockedNow,checkoutManagement. addAddress );

router.get('/user/remove/:addressId',  userSessionHandling.isBlockedNow,checkoutManagement.removeBillingAddress)
// /couponApply'
router.post('/couponApply',  userSessionHandling.isBlockedNow,checkoutManagement.couponApply   );



module.exports=router