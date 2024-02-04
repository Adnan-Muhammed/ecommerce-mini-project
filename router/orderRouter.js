const express = require('express');
const router = express.Router();

const orderManagement = require('../controller/orderManagement')


const userSessionHandling=require('../middleware/userSessionHandling')


router.post('/placeOrder', userSessionHandling.isBlockedNow, orderManagement.placeOrder  )
router.get('/orderplaced/success', userSessionHandling.isBlockedNow, orderManagement.orderPlacedSuccess)







module.exports=router
