const session = require('express-session');
const ProductDB = require('../models/product');
const UserDB = require('../models/user.js');
const WishlistDB = require('../models/wishlist.js');
const CartDB = require('../models/cart.js');

const fetchCategoryMiddleware =require('../middleware/fetchCategoryData');
const productDB = require('../models/product');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};




const wishlist = async (req, res) => {
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try {
      const user = await UserDB.findOne({ email: emailId });
      if (!user) {
        return res.status(404).send('User not found');
      }
      console.log('hj');
   console.log(56789);
      const wishlistItems = await WishlistDB.find({ userId: user._id });
      console.log('hj');
      
      if(wishlistItems.length>0){
        console.log(1);
        
        const productIds = wishlistItems.map(wishlistItems => wishlistItems.productId);
        console.log(2,'www');


       

      //   const products = await ProductDB.find({ 
      //     _id: { $in: productIds },
      //     isAvailable: false 
      // })
      // .populate('categoryId',null, { name: "KIDS" });

      // Find products where categoryId's isAvailable is true


// const products = await ProductDB.find({ 
//   _id: { $in: productIds },
//   isAvailable: true 
// }).populate({
//   path: 'categoryId',
//   match: { isAvailable: false } // Match condition for categoryId's isAvailable field
// });

const products = await ProductDB.find({
  _id: { $in: productIds  },
  isAvailable:true
  })
  .populate('categoryId')

     

      
        console.log(3,'eeeg cartItem look at productId');
        console.log(1,wishlistItems); //no need
        console.log('next');
        console.log(productIds);
        console.log('next products look at productId populated');
        console.log(products);
       // till  working well    no more

      console.log(1,'ikiki');

        
        const detailedwishlistItems = wishlistItems.map(wishlist => {
          const product = products.find(p => p._id.equals(wishlist.productId ));
          return {
            productId: wishlist._id,
            // quantity: product.quantity,
            name: product.name,
            images: product.image,


            stock: product.stock,
            unitPrice: product.price,
            // price: cartItem.price,
            // description: product.description,
            // isAvailable: product.isAvailable,


          };
      });
      console.log(detailedwishlistItems);
      console.log(2, 'ikiki');
  
//       let totalPrice = 0;
// for (const cartItem of detailedCartItems) {
//   totalPrice += cartItem.price;
// }
// const taxValue = 10.00; // You can change this to your actual tax value
// const grandTotal = totalPrice + taxValue;
console.log('hello welcome    wishlist');
console.log(detailedwishlistItems[0].images[0]);
res.render('user/wishlist', { wishlistItems: detailedwishlistItems, isLogged, primaryCategories, otherCategories });

      }else{
     // console.log(404);
        res.render('user/wishlist', {isLogged, primaryCategories, otherCategories  });
      }
   // console.log(878787);
    } catch (err) {
      // console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error right now');
    }
  };





const addtoWishlist = async (req, res) => {
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
  
    const email = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    const productId = req.params.id;
  
    try {
        const user = await UserDB.findOne({ email: email });
        const product = await ProductDB.findById(productId);
        // const newQuantity = 1;
  
        if (!user || !product || product.stock <= 0) {
            // Handle user not found or product not available
            req.session.wishlistProduct = true;

            return res.redirect(`/productdetails/${req.params.id}`);
        }
  
        // let cartItem = await CartDB.findOne({ userId: user._id, productId: product._id });
  
        // if (cartItem) {
        //     // If the product already exists in the cart, update its quantity and price
        //     await CartDB.findOneAndUpdate(
        //         { userId: user._id, productId: product._id },
        //         {
        //             $inc: { quantity: newQuantity }, // Increment quantity
        //             $set: { price: cartItem.price + (product.price * newQuantity) } // Update price
        //         }
        //     );
        // } else {
            // If the product doesn't exist, create a new cart item
            wishlistItem = new WishlistDB({
                userId: user._id,
                productId: product._id,
                // quantity: newQuantity,
                // price: product.price * newQuantity,
            });
            await wishlistItem.save();
        // }
  
        // Redirect to the cart page after a successful addition
        res.redirect('/wishlist');
    } catch (err) {
        // Handle errors appropriately
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
  };
  

 const removeFromWishlist= async (req, res) => {
    const productIdToRemove = req.params.productId;
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  
    try {
      console.log('123456789asdfghjk');
      const user = await UserDB.findOne({ email: emailId });
  
      if (!user) {
        // console.log('User not found');
        return res.status(404).send('User not found');
      }
  
      const idstr=user._id.toString()
      // console.log(22);
      // console.log(user._id);
      // console.log(idstr);
  
      // console.log(productIdToRemove);
      // console.log(55);
  
      // Find and remove the item from the cart
      // await CartDB.findOneAndDelete({ userId: idstr, productId: productIdToRemove });
      await WishlistDB.findOneAndDelete({ _id:productIdToRemove });//first
  
  
      // Redirect back to the cart page or send a success response
      res.redirect('/wishlist'); // You can change this to the appropriate URL
  
    } catch (err) {
      // console.error('Error removing product from cart:', err);
      res.status(500).send('Internal Server Error');
    }
  };

module.exports={
    addtoWishlist,
    wishlist,
    removeFromWishlist,
}