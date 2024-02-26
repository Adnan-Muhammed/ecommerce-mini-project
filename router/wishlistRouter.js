const express = require('express');
const router = express.Router();

const userSessionHandling=require('../middleware/userSessionHandling')

const session=require("express-session")
router.use(session({
    secret:"secretqwerty",
    resave:false,
    saveUninitialized:true
}))



// const cartSession=(req,res,next)=>{
//     const cartId =req.params.id
//     console.log(cartId);
//      req.session.cartId=cartId
//     console.log('cartRouter cartSession creates here');
   
//      next()
//   }

const wishlistManagement = require('../controller/wishlistController')


router.get('/wishlist',userSessionHandling.userlogged,wishlistManagement.wishlist)
router.get('/wishlist/:id', userSessionHandling.userlogged,wishlistManagement.addtoWishlist)
router.get('/wishlist/remove/:productId',userSessionHandling.userlogged, wishlistManagement.removeFromWishlist);






module.exports=router
