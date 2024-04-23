const express = require('express');
const router = express.Router();

const userSessionHandling=require('../middleware/userSessionHandling')

const session=require("express-session")
router.use(session({
    secret:"secretqwerty",
    resave:false,
    saveUninitialized:true
}))


const cartManagement = require('../controller/cartManagement')
 const cartSession=(req,res,next)=>{
   const cartId =req.params.id
    req.session.cartId=cartId
 

    next()
 }


 router.get('/cartpage',userSessionHandling.isBlockedNow2,cartManagement.cartPage)
 router.get('/cart/:id', cartSession,userSessionHandling.isBlockedNow2,cartManagement.addtoCart)
 router.get('/cart/remove/:productId',userSessionHandling.isBlockedNow2, cartManagement.removeFromCart);
 router.post('/updateQuantity',userSessionHandling.isBlockedNow2, cartManagement.updateQuantity);










module.exports=router


