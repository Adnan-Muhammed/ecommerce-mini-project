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

            const products = await ProductDB.find({
              _id: { $in: productIds  },
              isAvailable:true
              })
              .populate('categoryId')

              console.log('hello',12345);
console.log(1,wishlistItems);
        console.log(1,wishlistItems[0].productId); //no need
        console.log('next');
        // console.log(productIds);
        console.log('next products look at productId populated');
        // console.log(products);
       // till  working well    no more
      console.log(1,'ikiki');
        const detailedwishlistItems = wishlistItems.map(wishlist => {
          const product = products.find(p => p._id.equals(wishlist.productId ));
          return {
            productId: wishlist.productId,
            wishlistId: wishlist._id,
            name: product.name,
            images: product.image,
            stock: product.stock,
            unitPrice: product.price,
            // price: cartItem.price,
            // description: product.description,
            // isAvailable: product.isAvailable,
          };
      });
      // console.log(detailedwishlistItems);
      console.log(2, 'ikiki');
// console.log(detailedwishlistItems[0].images[0]);
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
        if (!user || !product || product.stock <= 0) {
            req.session.wishlistProduct = true;
            return res.redirect(`/productdetails/${req.params.id}`);
        }
        let wishlistItem = await WishlistDB.findOne({ userId: user._id, productId: product._id });
        if(!wishlistItem){
          wishlistItem = new WishlistDB({
              userId: user._id,
              productId: product._id,
          });
          await wishlistItem.save();
      res.redirect('/wishlist');
        }else{
          req.session.wishlist=true
          res.redirect(`/productdetails/${productId}`)
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
  };
  






const removeFromWishlist = async (req, res) => {
    const wishlistIdToRemove = req.params.wishlistId;
    console.log(wishlistIdToRemove);
    console.log(1234);
    try {
      const removedItem =   await WishlistDB.findOneAndDelete({ _id: wishlistIdToRemove });//first
        // const removedItem = await WishlistDB.findByIdAndRemove(wishlistIdToRemove);
        if (!removedItem) {
            return res.status(404).json({ error: 'Wishlist item not found' });
        }
        res.status(200).json({ message: 'Item removed from wishlist successfully' });
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


  

module.exports={
    addtoWishlist,
    wishlist,
    removeFromWishlist,
}