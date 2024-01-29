const session = require('express-session');
const ProductDB = require('../models/product');
const UserDB = require('../models/user.js');
const CartDB = require('../models/cart.js');

const fetchCategoryMiddleware =require('../middleware/fetchCategoryData');
const productDB = require('../models/product');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};


const cartPage = async (req, res) => {
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
  
      res.render('user/cart', { cartItems: detailedCartItems, isLogged, primaryCategories, otherCategories ,totalprice:totalPrice,tax, grandTotal });
  
    } catch (err) {
      console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error');
    }
  };
  





const addtoCart=async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

    const email=(req.session.user)?req.session.user.email:req.session.userNew.email
    const productId= req.params.id
    console.log(email);
    console.log(productId);


    try{
      const user = await UserDB.findOne({email:email});
    const product = await ProductDB.findById(productId);
    const newQuantity = 1

    if (!user || !product) {
        // Handle user or product not found
        return;
      }

      if (product.stock >= newQuantity) {
        const cartItem = new CartDB({
            userId: user._id,
            productId: product._id,
            quantity: newQuantity,
            price: product.price * newQuantity,
        });

        await cartItem.save();
    }

    // Redirect to the cart page after a successful addition
    res.redirect('/cartpage');

} catch (err) {
    console.error(err);
    // Handle errors appropriately
    res.status(500).send('Internal Server Error');
}
}








const removeFromCart = async (req, res) => {
  const productIdToRemove = req.params.productId;
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

  try {
    const user = await UserDB.findOne({ email: emailId });

    if (!user) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    const idstr=user._id.toString()
    console.log(22);
    console.log(user._id);
    console.log(idstr);

    console.log(productIdToRemove);
    console.log(55);

    // Find and remove the item from the cart
    await CartDB.findOneAndDelete({ userId: idstr, productId: productIdToRemove });


    // Redirect back to the cart page or send a success response
    res.redirect('/cartpage'); // You can change this to the appropriate URL

  } catch (err) {
    console.error('Error removing product from cart:', err);
    res.status(500).send('Internal Server Error');
  }
};





const updateCartQuantities = async (req, res) => {
  try {
    const updates = req.body.updates;
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    // Find the user
    const user = await UserDB.findOne({ email: emailId });

    if (!user) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    // Iterate through the updates and update quantities in the CartDB collection
    for (const update of updates) {
      const productId = update.productId;

      // Find the cart item for the user and product
      const cartItem = await CartDB.findOne({ userId: user._id, productId: productId });
      const product = await productDB.findOne({ _id: productId })
      const quantity = (parseInt(update.quantity)  <= product.stock)?update.quantity:product.stock

      console.log(product.price);
      console.log(6666666);
      if (cartItem) {
        // Update the quantity and price in the cart item
        cartItem.quantity = quantity;
        // cartItem.price = quantity * cartItem.price / cartItem.quantity; // Recalculate the price based on the new quantity
        cartItem.price = quantity * product.price
        await cartItem.save();
      }
    }
res.redirect('/cartpage')
    // Redirect to the cart page or send a success message
    // res.json({ success: true, message: 'Cart updated successfully' });
  } catch (err) {
    console.error('Error updating cart quantities:', err);
    res.status(500).send('Internal Server Error');
  }
};




module.exports ={
    cartPage,
    addtoCart,
    removeFromCart,
    updateCartQuantities,
}


