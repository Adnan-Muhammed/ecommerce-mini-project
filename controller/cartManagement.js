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
        return res.status(404).send('User not found');
      }
      console.log('hj');
   console.log(56789);
      const cartItems = await CartDB.find({ userId: user._id });
      console.log('hj');
      
      if(cartItems.length>0){
        console.log(1);
        
        const productIds = cartItems.map(cartItem => cartItem.productId);
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
        console.log(1,cartItems); //no need
        console.log('next');
        console.log(productIds);
        console.log('next products look at productId populated');
        console.log(products);
       // till  working well    no more

      console.log(1,'ikiki');

        
        const detailedCartItems = cartItems.map(cartItem => {
          const product = products.find(p => p._id.equals(cartItem.productId ));
          return {
            productId: cartItem._id,
            quantity: cartItem.quantity,
            name: product.name,
            images: product.image,
            stock: product.stock,
            unitPrice: product.price,
            price: cartItem.price,
            description: product.description,
            isAvailable: product.isAvailable,
          };
      });
      console.log(detailedCartItems);
      console.log(2, 'ikiki');
  
      let totalPrice = 0;
for (const cartItem of detailedCartItems) {
  totalPrice += cartItem.price;
}
const taxValue = 10.00; // You can change this to your actual tax value
const grandTotal = totalPrice + taxValue;
console.log('hello welcome    cart page');
console.log(detailedCartItems[0].images[0]);
res.render('user/cart', { cartItems: detailedCartItems, isLogged, primaryCategories, otherCategories ,totalprice:totalPrice,taxValue, grandTotal });

      }else{
     // console.log(404);
        res.render('user/cart', {isLogged, primaryCategories, otherCategories  });
      }
   // console.log(878787);
    } catch (err) {
      // console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error right now');
    }
  };

  
const cartPage2 = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  try {
    const user = await UserDB.findOne({ email: emailId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const cartItems = await CartDB.find({ userId: user._id });
    
    if(cartItems.length>0){
      
      const productIds = cartItems.map(cartItem => cartItem.productId);


     
const products = await ProductDB.find({
_id: { $in: productIds  },
isAvailable:true
})
.populate('categoryId')

   

    
      console.log('cartItems length',cartItems.length);
      console.log(cartItems); //no need
      console.log('productId collected from cartList' ,productIds.length);
      console.log(productIds);       
      console.log('productList by fetch in cartList productId',products.length);
      console.log(products);
     // till  working well    no more

    // console.log(1,'ikiki');

      

    const detailedCartItems = cartItems.map(cartItem => {
      const product = products.find(p => p._id.equals(cartItem.productId));
      return {
        // asdfg: product,

          productId: cartItem._id,
          quantity: cartItem.quantity,
          name: product.name,
          images: product.image,
          stock: product.stock,
          unitPrice: product.price,
          price: cartItem.price,
          description: product.description,
          isAvailable: product.isAvailable,
      };
  });
  console.log(detailedCartItems);
  
    console.log(2, 'ikikjgvhcgcgi');
    
   

    let totalPrice = 0;
for (const cartItem of products) {
totalPrice += cartItem.price;
}
console.log(totalPrice);
const taxValue = 10.00; // You can change this to your actual tax value
const grandTotal = totalPrice + taxValue;
console.log('hello welcome    cart page');
console.log(detailedCartItems[0].price);
res.render('user/cart', { cartItems: products, isLogged, primaryCategories, otherCategories ,totalprice:totalPrice,taxValue, grandTotal });

    }else{
   // console.log(404);
      res.render('user/cart', {isLogged, primaryCategories, otherCategories  });
    }
 // console.log(878787);
  } catch (err) {
    // console.error('Error fetching cart items:', err);
    res.status(500).send('Internal Server Error right now');
  }
};

  





const addtoCart2=async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

    const email=(req.session.user)?req.session.user.email:req.session.userNew.email
    const productId= req.params.id

    try{
      const user = await UserDB.findOne({email:email});
      const product = await ProductDB.findById(productId);
      const newQuantity = 1

    if (!user || !product.stock>0) {
        // Handle user or product not found
        console.log(66666);
        req.session.cartProduct=true
        return res.redirect(`/productdetails/${req.params.id}`)
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
    // console.error(err);
    // Handle errors appropriately
    res.status(500).send('Internal Server Error');
}
}

const addtoCart = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

  const email = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  const productId = req.params.id;

  try {
      const user = await UserDB.findOne({ email: email });
      const product = await ProductDB.findById(productId);
      const newQuantity = 1;

      if (!user || !product || product.stock <= 0) {
          // Handle user not found or product not available
          req.session.cartProduct = true;
          return res.redirect(`/productdetails/${req.params.id}`);
      }

      let cartItem = await CartDB.findOne({ userId: user._id, productId: product._id });

      if (cartItem) {
          // If the product already exists in the cart, update its quantity and price
          await CartDB.findOneAndUpdate(
              { userId: user._id, productId: product._id },
              {
                  $inc: { quantity: newQuantity }, // Increment quantity
                  $set: { price: cartItem.price + (product.price * newQuantity) } // Update price
              }
          );
      } else {
          // If the product doesn't exist, create a new cart item
          cartItem = new CartDB({
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
      // Handle errors appropriately
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};









const removeFromCart = async (req, res) => {
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
    await CartDB.findOneAndDelete({ _id:productIdToRemove });//first


    // Redirect back to the cart page or send a success response
    res.redirect('/cartpage'); // You can change this to the appropriate URL

  } catch (err) {
    // console.error('Error removing product from cart:', err);
    res.status(500).send('Internal Server Error');
  }
};





// const updateCartQuantities = async (req, res) => {
//   try {
//     const updates = req.body.updates;
//     const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

//     // Find the user

//     if (!user) {
//       // console.log('User not found');
//       return res.status(404).send('User not found');
//     }

//     // Iterate through the updates and update quantities in the CartDB collection
//     for (const update of updates) {
//       const productId = update.productId;

//       // Find the cart item for the user and product
//       const cartItem = await CartDB.findOne({ userId: user._id, productId: productId });
//       const product = await productDB.findOne({ _id: productId })
//       const quantity = (parseInt(update.quantity)  <= product.stock)?update.quantity:product.stock

//       // console.log(product.price);
//       // console.log(6666666);
//       if (cartItem) {
//         // Update the quantity and price in the cart item
//         cartItem.quantity = quantity;
//         // cartItem.price = quantity * cartItem.price / cartItem.quantity; // Recalculate the price based on the new quantity
//         cartItem.price = quantity * product.price
//         await cartItem.save();
//       }
//     }
// res.redirect('/cartpage')
//     // Redirect to the cart page or send a success message
//     // res.json({ success: true, message: 'Cart updated successfully' });
//   } catch (err) {
//     // console.error('Error updating cart quantities:', err);
//     res.status(500).send('Internal Server Error');
//   }
// };




const updateQuantity = async (req, res) => {
  const { productId, newQuantity } = req.body;
  // console.log(productId ,newQuantity);
  try {

    if (!productId || !newQuantity || isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    const user = await UserDB.findOne({ email: emailId });
    // const cartItem = await CartDB.findOne({ userId: user._id, productId: productId });
    const cartItem = await CartDB.findOne({_id:productId });
    
    const product = await productDB.findOne({ _id: cartItem.productId })

    const taxValue = 10.00; // You can change this to your actual tax value


    if(newQuantity<=product.stock){
      // console.log(product.stock);
      // console.log(newQuantity);
      cartItem.quantity = newQuantity;
      cartItem.price = (newQuantity||1) * product.price
      await cartItem.save();
      // console.log('out of stock false');
      
      const cartRecords = await CartDB.find({userId: user._id})
  
        // Calculate the sum of prices
        const priceSum = cartRecords.reduce((sum, record) => sum + record.price, 0);
        const grandTotal =priceSum+taxValue
      
    

      return res.json({ outOfStock:false, product: { stock: product.stock },newQuantity: newQuantity, price:cartItem,taxValue, priceSum: priceSum ,grandTotal });

    }
    else{
      // console.log('out of stock true');

      const cartRecords = await CartDB.find({userId: user._id})
  
        // Calculate the sum of prices
        const priceSum = cartRecords.reduce((sum, record) => sum + record.price, 0);
        const grandTotal =priceSum+taxValue


      return res.json({ outOfStock: true, product: { stock: product.stock},newQuantity: newQuantity, price:cartItem ,priceSum: priceSum ,grandTotal});

    }



    

    // Optionally, you may send a success message
  } catch (err) {
    // Properly handle errors, log them, and return an appropriate response
    // console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};








module.exports ={
    cartPage,
    addtoCart,
    removeFromCart,
    // updateCartQuantities,
    updateQuantity,
}
