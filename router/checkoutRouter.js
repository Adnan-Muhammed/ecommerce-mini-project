const express = require('express');
const router = express.Router();

const checkoutManagement = require('../controller/checkoutManagement')


const userSessionHandling=require('../middleware/userSessionHandling')

router.get('/checkout', userSessionHandling.isBlockedNow,checkoutManagement.checkoutPage)



router.post('/address-added',  userSessionHandling.isBlockedNow,checkoutManagement. addAddress );

router.get('/:userId/remove/:addressId', userSessionHandling.isBlockedNow,checkoutManagement.removeBillingAddress)




module.exports=router