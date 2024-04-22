const express = require('express');
const router = express.Router();

const orderManagement = require('../controller/orderManagement')


const userSessionHandling=require('../middleware/userSessionHandling')


router.post('/placeOrder',   orderManagement.placeOrder  )
router.get('/orderplaced/success', userSessionHandling.isBlockedNow2, orderManagement.orderPlacedSuccess)
router.get('/orderplaced/failed', userSessionHandling.isBlockedNow2, orderManagement.orderPlacedFailed)



router.post('/admin/editOrder/:orderId', userSessionHandling.isBlockedNow, orderManagement.orderStatus )

  
router.post('/cancelOrder/:orderId',userSessionHandling.isBlockedNow, orderManagement.handleOrderStatusUpdate )
router.post('/returnOrder/:orderId', userSessionHandling.isBlockedNow, orderManagement.handleOrderStatusUpdate)

router.post('/orderPaymentUpdate',  orderManagement.repaymentOrder)


module.exports=router
