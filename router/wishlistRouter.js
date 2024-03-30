const express = require('express');
const router = express.Router();

const userSessionHandling=require('../middleware/userSessionHandling')

const session=require("express-session")
router.use(session({
    secret:"secretqwerty",
    resave:false,
    saveUninitialized:true
}))



const wishlistManagement = require('../controller/wishlistController')


router.get('/wishlist',userSessionHandling.isBlockedNow2,wishlistManagement.wishlist)
router.get('/wishlist/:id', userSessionHandling.isBlockedNow2,wishlistManagement.addtoWishlist)
router.get('/remove/wishlist/:wishlistId',  userSessionHandling.isBlockedNow2,wishlistManagement.removeFromWishlist);






module.exports=router
