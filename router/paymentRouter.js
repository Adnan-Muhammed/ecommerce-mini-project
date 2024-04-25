const express = require('express');
const router = express.Router();


const paymentController= require('../controller/paymentController')


router.post('/orderId',paymentController.OrderPayment)




module.exports=router

