const session = require('express-session');
const ProductDB = require('../models/product');
const UserDB = require('../models/user.js');
const CartDB = require('../models/cart.js');
const CouponDB = require('../models/coupon.js')

const fetchCategoryMiddleware =require('../middleware/fetchCategoryData');
const productDB = require('../models/product');
const { log } = require('util');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};








  
  

const cartPage = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
  const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;

  try {
    const user = await UserDB.findOne({ email: emailId });
    if (!user) {
      return res.status(404).send('User not found');
    }
    const currentDate = new Date();

    const coupons = await CouponDB.find({
      isAvailable: true,
      userIds: { $not: { $in: [user._id] } },
      expiryDate: { $gt: currentDate }
    });

    const cartItems = await CartDB.find({ userId: user._id });

    if (cartItems.length > 0) {
      const productIds = cartItems.map((cartItem) => cartItem.productId);
      const productsData = await ProductDB.find({
        _id: { $in: productIds },
        isAvailable: true,
      }).populate({
        path: 'categoryId',
        match: { isAvailable: true } 
      });

      const products = productsData.filter(data => data.categoryId !== null);

      const categoryOffers = {};
      const productOffers = {};

      // Separate products by category
      const productsByCategory = {};
      products.forEach(product => {
        const categoryId = product.categoryId._id.toString();
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = [];
        }
        productsByCategory[categoryId].push(product);
      });

      // Calculate product and category offers
      for (const categoryId in productsByCategory) {
        const categoryProducts = productsByCategory[categoryId];
        const categoryDiscount = categoryProducts[0].categoryId.discountPercentage;

        categoryProducts.forEach(product => {
          const productId = product._id.toString();

          if (product.discountPercentage > 0 && (!product.expiryDate || product.expiryDate >= currentDate)) {
            productOffers[productId] = product.discountPercentage;
          } else {
            if (!productOffers[productId]) {
              const startDate = product.categoryId.startDate;
              const endDate = product.categoryId.endDate;

              if (startDate && endDate) {
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);

                if (currentDate >= startDateObj && currentDate <= endDateObj) {
                  if (!categoryOffers[categoryId]) {
                    categoryOffers[categoryId] = {
                      discountPercentage: categoryDiscount,
                      categoryName: categoryProducts[0].categoryId.name,
                      products: [],
                    };
                  }
                  categoryOffers[categoryId].products.push(product);
                }
              } else {
                if (!categoryOffers[categoryId]) {
                  categoryOffers[categoryId] = {
                    discountPercentage: categoryDiscount,
                    categoryName: categoryProducts[0].categoryId.name,
                    products: [],
                  };
                }
                categoryOffers[categoryId].products.push(product);
              }
            }
          }
        });
      }

      // Generate detailed cart items with offers applied
      const detailedCartItems = cartItems.map((cartItem) => {
        const product = products.find((p) => p._id.equals(cartItem.productId));

        if (!product) {
          return null;
        }

        const productId = product._id.toString();
        const categoryId = product.categoryId._id.toString();

        let price = product.price * cartItem.quantity;
        let categoryDiscount = 0;
        let productDiscount = 0;

        if (productOffers[productId]) {
          productDiscount = productOffers[productId];
          price -= (price * productDiscount) / 100;
        } else if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
          categoryDiscount = categoryOffers[categoryId].discountPercentage;
          price -= (price * categoryDiscount) / 100;
        }

        return {
          productId: cartItem._id,
          quantity: cartItem.quantity,
          name: product.name,
          images: product.image,
          stock: product.stock,
          unitPrice: product.price,
          price: price,
          description: product.description,
          isAvailable: product.isAvailable,
          categoryOffer: categoryDiscount > 0 ? { discountPercentage: categoryDiscount, categoryName: categoryOffers[categoryId].categoryName } : null,
          productOffer: productDiscount > 0 ? { discountPercentage: productDiscount } : null,
        };
      }).filter(item => item !== null);

      let totalPrice = detailedCartItems.reduce((total, item) => total + item.price, 0);

      const taxValue = 10.00; 
      const deliveryCharge = 50.00;
      const grandTotal = totalPrice + taxValue + deliveryCharge;

      res.render('user/cart', {
        cartItems: detailedCartItems,
        isLogged,
        primaryCategories,
        otherCategories,
        totalPrice,
        taxValue,
        deliveryCharge,
        grandTotal,
        coupons,
        categoryOffers,
        productOffers,
      });
    } else {
      res.render('user/cart', { isLogged, primaryCategories, otherCategories, coupons });
    }
  } catch (err) {
    res.status(500).send('Internal Server Error right now');
  }
};








const addtoCart = async (req, res) => {

  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

  const email = (req.session.user) ? req.session.user.email : req.session.userNew.email;


  const productId = req.params.id;

  try {
      const user = await UserDB.findOne({ email: email });
      const product = await ProductDB.findById(productId);
      const newQuantity = 1;
      console.log(product);
      console.log(newQuantity);

      if (!user || product.stock <= 0) {
          // Handle user not found or product not available
          if(user){
          }
          if(product){
          }
          if(product){
          }
          req.session.cartProduct = true;
          return res.redirect(`/productdetails/${req.params.id}`);
      }
      let cartItem = await CartDB.findOne({ userId: user._id, productId: product._id });

      if (cartItem) {
        const incStock= cartItem.stock+newQuantity
          if (incStock <= cartItem.stock && cartItem.stock != 0) {
            await CartDB.findOneAndUpdate(
              { userId: user._id, productId: product._id },
              {
                $inc: { quantity:incStock  }, // Increment quantity
                $set: { price: cartItem.price + (product.price * newQuantity) } // Update price
            });
            }else{
            return  res.redirect('/cartpage');
            }
    }else {
          cartItem = new CartDB({
              userId: user._id,
              productId: product._id,
              quantity: newQuantity,
              stock:product.stock,
              price: product.price * newQuantity,
          });
          await cartItem.save();
      }
      return  res.redirect('/cartpage');


  } catch (err) {
      // Handle errors appropriately
      res.status(500).send('Internal Server Error');
  }
};












const removeFromCart = async (req, res) => {
  const productIdToRemove = req.params.productId;
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

  try {

    const user = await UserDB.findOne({ email: emailId });

    if (!user) {
      // console.log('User not found');
      return res.status(404).send('User not found');
    }

    const idstr=user._id.toString()
   

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



const updateQuantity = async (req, res) => {
  const { productId, newQuantity } = req.body;
  
  try {
    if (!productId || !newQuantity || isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    const user = await UserDB.findOne({ email: emailId });
    const cartItem = await CartDB.findOne({_id: productId });
    const productData = await ProductDB.findOne({ _id: cartItem.productId }).populate({
      path: 'categoryId',
      match: { isAvailable: true } // Add condition for category's isAvailable field
    });

    if (!productData || productData.categoryId === null || !productData.categoryId.isAvailable) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (productData.stock < newQuantity) {
      return res.status(404).json({ message: 'Out of stock' });
    }

    // Update quantity and price in cartItem
    if (newQuantity <= productData.stock) {
      cartItem.quantity = newQuantity;
      cartItem.price = newQuantity * productData.price;
      await cartItem.save();
    }

    // Calculate final price after discounts
    let finalPrice = productData.price;

    if (productData.discountPercentage && productData.discountPercentage > 0) {
      const currentDate = new Date();
      const expiryDate = productData.expiryDate ? new Date(productData.expiryDate) : null;

      if (!expiryDate || currentDate <= expiryDate) {
        finalPrice -= (finalPrice * productData.discountPercentage) / 100;
      }
    } else if (productData.categoryId.discountPercentage > 0) {
      const currentDate = new Date();
      let startDate = null;
      let endDate = null;
      
      if (productData.categoryId.startDate) {
        startDate = new Date(productData.categoryId.startDate);
      }
      if (productData.categoryId.endDate) {
        endDate = new Date(productData.categoryId.endDate);
      }

      if (!startDate || (currentDate >= startDate && currentDate <= endDate)) {
        finalPrice -= (finalPrice * productData.categoryId.discountPercentage) / 100;
      }
    }

    // Ensure the final price is not negative and round to the nearest integer
    finalPrice = Math.round(Math.max(0, finalPrice) * newQuantity);

    // Fetch other cart items of the user
    const cartItems = await CartDB.find({ userId: user._id, productId: { $ne: productData._id } });
    const productIds = cartItems.map((cartItem) => cartItem.productId);
    const productsData = await ProductDB.find({
      _id: { $in: productIds },
      isAvailable: true,
    }).populate({
      path: 'categoryId',
      match: { isAvailable: true } // Add condition for category's isAvailable field
    });

    // Filter products by available categories
    const products = productsData.filter(data => data.categoryId !== null);

    // Generate detailed cart items with offers applied
    const detailedCartItems = cartItems.map((cartItem) => {
      const product = products.find((p) => p._id.equals(cartItem.productId));

      if (!product) {
        return null;
      }

      let price = cartItem.price;
      let offer = null;

      if (product.discountPercentage && product.discountPercentage > 0) {
        offer = { discountPercentage: product.discountPercentage };
        price -= (price * product.discountPercentage) / 100;
      } else if (product.categoryId.discountPercentage > 0) {
        offer = { discountPercentage: product.categoryId.discountPercentage };
        price -= (price * product.categoryId.discountPercentage) / 100;
      }

      return {
        productId: cartItem._id,
        quantity: cartItem.quantity,
        name: product.name,
        images: product.image,
        stock: product.stock,
        unitPrice: product.price,
        price: price,
        description: product.description,
        isAvailable: product.isAvailable,
        offer: offer,
      };
    }).filter(item => item !== null);

    // Calculate total price from detailedCartItems
    const totalPrice = detailedCartItems.reduce((total, item) => total + item.price, 0);

    // Calculate subTotal and grandTotal
    const taxValue = 10.00; // You can change this to your actual tax value
    const deliveryCharge =50.00;
    const subTotal = Math.round(totalPrice + finalPrice);
    const grandTotal = Math.round(totalPrice + finalPrice + taxValue  + deliveryCharge );

    return res.json({
      cartItems: detailedCartItems,
      totalPrice,
      taxValue,
      subTotal,
      grandTotal,
      outOfStock: false,
      newQuantity: newQuantity,
      finalPrice: finalPrice,
    });
  } catch (err) {
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
