const express = require('express');
const router = express.Router();

const checkoutManagement = require('../controller/checkoutManagement')


const userSessionHandling=require('../middleware/userSessionHandling')

router.get('/checkout', userSessionHandling.isBlockedNow,checkoutManagement.checkoutPage)


module.exports=router