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
   console.log(cartId);
    req.session.cartId=cartId
   console.log('cartRouter cartSession creates here');

    next()
 }


router.get('/cartpage',userSessionHandling.userlogged,cartManagement.cartPage)
router.get('/cart/:id', cartSession,userSessionHandling.userlogged,cartManagement.addtoCart)//
router.get('/remove/:productId',userSessionHandling.userlogged, cartManagement.removeFromCart);

router.post('/update-cart', userSessionHandling.userlogged, cartManagement.updateCartQuantities);










module.exports=router


