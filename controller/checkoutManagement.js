const UserDB = require('../models/user');
const ProductDB = require('../models/product')
const CartDB = require('../models/cart')
// const CategoryDB = require('../models/')


const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};




// const categoryPage=async(req,res)=>{
//     const isLogged = determineIsLogged(req.session);
// const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
// console.log(isLogged);


//     res.render('user/checkout',{isLogged})
// }



const categoryPage = async (req, res) => {
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  
    try {
      const user = await UserDB.findOne({ email: emailId });
  
      if (!user) {
        console.log('User not found');
        return res.status(404).send('User not found');
      }
  
      // Find cart items for the user
      const cartItems = await CartDB.find({ userId: user._id });

      console.log(111);
  console.log(cartItems.productId)
  console.log(222);
      // Extract productIds from cartItems
      const productIds = cartItems.map(cartItem => cartItem.productId);
  console.log(productIds);
  console.log(333);
      // Find products based on productIds
      const products = await ProductDB.find({ _id: { $in: productIds } });
  console.log(products);
  console.log(444);
      // Create an object to store detailed information about each cart item
      const detailedCartItems = cartItems.map(cartItem => {
        const product = products.find(p => p._id.equals(cartItem.productId));
  
        return {
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          name:product.name,
          images: product.image,
          stock: product.stock,
          unitPrice: product.price,
          price:cartItem.price,
          description: product.description,
          isAvailable: product.isAvailable,
        };
      });
  
      console.log(detailedCartItems);
      console.log(detailedCartItems.length);

      let totalPrice = 0;

for (const cartItem of detailedCartItems) {
  totalPrice += cartItem.price;
}
console.log(totalPrice);

const tax = 10.00; // You can change this to your actual tax value
const grandTotal = totalPrice + tax;
  




      res.render('user/checkout', { cartItems: detailedCartItems, isLogged, primaryCategories, otherCategories ,totalprice:totalPrice,tax, grandTotal });
  
    } catch (err) {
      console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error');
    }
  };
  


module.exports={
    categoryPage,
}