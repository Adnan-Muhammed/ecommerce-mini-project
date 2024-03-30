const express = require('express');
const router = express.Router();

const orderManagement = require('../controller/orderManagement')


const userSessionHandling=require('../middleware/userSessionHandling')


router.post('/placeOrder', userSessionHandling.isBlockedNow, orderManagement.placeOrder  )
router.get('/orderplaced/success', userSessionHandling.isBlockedNow2, orderManagement.orderPlacedSuccess)



router.post('/admin/editOrder/:orderId', userSessionHandling.isBlockedNow, orderManagement.orderStatus )

  
router.post('/cancelOrder/:orderId',userSessionHandling.isBlockedNow, orderManagement.handleOrderStatusUpdate )
router.post('/returnOrder/:orderId',userSessionHandling.isBlockedNow, orderManagement.handleOrderStatusUpdate)


module.exports=router
