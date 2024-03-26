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








  
  

//correct code
const cartPage = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
  const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;
  try {
      const user = await UserDB.findOne({ email: emailId });
      if (!user) {
          return res.status(404).send('User not found');
      }
      const currentDate = new Date(); // Get the current date
      // Fetch available coupons for the user
      const coupons = await CouponDB.find({
          isAvailable: true,
          userIds: { $not: { $in: [user._id] } },
          expiryDate: { $gt: currentDate } // Filter by expiry date greater than current date
      });

      const cartItems = await CartDB.find({ userId: user._id });
      if (cartItems.length > 0) {
          const productIds = cartItems.map((cartItem) => cartItem.productId);
          const productsData = await ProductDB.find({
            _id: { $in: productIds },
            isAvailable: true,
        }).populate({
            path: 'categoryId',
            match: { isAvailable: true } // Add condition for category's isAvailable field
        });

      // Now products only contain items where the associated category is available
      
        const products = productsData.filter(data => data.categoryId !== null)
          // Fetch category offers and calculate product offers
          const categoryOffers = {}; // Store category offers
          const productOffers = {}; // Store product offers

          for (const product of products) {
              const categoryId = product.categoryId._id.toString();
              const categoryDiscount = product.categoryId.discountPercentage;

              // Calculate product offer
              if (product.discountPercentage > 0) {
                  // Check if expiry date is available and not expired
                  if (!product.expiryDate || product.expiryDate >= currentDate) {
                      productOffers[product._id.toString()] = product.discountPercentage;
                  }
              }

              
              if (product.categoryId.startDate && product.categoryId.endDate) {
                const startDate = new Date(product.categoryId.startDate);
                const endDate = new Date(product.categoryId.endDate);

                  // Check if the current date is within the discount offer period
                  if (currentDate >= startDate && currentDate <= endDate) {
                      if (!categoryOffers[categoryId]) {
                          categoryOffers[categoryId] = {
                              discountPercentage: categoryDiscount,
                              categoryName: product.categoryId.name,
                              products: [],
                          };
                      }
                      categoryOffers[categoryId].products.push(product);
                  }
              } else {
                  // If start and end dates are not available, consider the offer as permanent
                  if (!categoryOffers[categoryId]) {
                      categoryOffers[categoryId] = {
                          discountPercentage: categoryDiscount,
                          categoryName: product.categoryId.name,
                          products: [],
                      };
                  }
                  categoryOffers[categoryId].products.push(product);
              }





          }

          // Generate detailed cart items with offers applied
          const detailedCartItems = cartItems.map((cartItem) => {
              const product = products.find((p) => p._id.equals(cartItem.productId));

              if(!product){
                return null
              }

              

              const categoryId = product.categoryId._id.toString();

              // Calculate total price after applying product discount and category discount

              let price = product.price *  cartItem.quantity;
              let categoryDiscount = 0;
              let productDiscount = 0;

              // Apply product discount if available
              if (productOffers[product._id.toString()]) {
                  productDiscount = productOffers[product._id.toString()];
                  price -= (price * productDiscount) / 100;
              }

              // Apply category discount if available
              if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
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
                  // Include category offer and product offer details if available
                  categoryOffer: categoryDiscount > 0 ? { discountPercentage: categoryDiscount, categoryName: categoryOffers[categoryId].categoryName } : null,
                  productOffer: productDiscount > 0 ? { discountPercentage: productDiscount } : null,
              };


            })
            .filter(item => item !== null);

          // Calculate total price
          let totalPrice = detailedCartItems.reduce((total, item) => total + item.price, 0);

          // Apply tax
          const taxValue = 10.00; // You can change this to your actual tax value
          const grandTotal = totalPrice + taxValue;

          res.render('user/cart', {
              cartItems: detailedCartItems,
              isLogged,
              primaryCategories,
              otherCategories,
              totalPrice,
              taxValue,
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


  // console.log(13,'uio',789);
  const productId = req.params.id;
  // console.log(productId);

  try {
      const user = await UserDB.findOne({ email: email });
      const product = await ProductDB.findById(productId);
      const newQuantity = 1;
      console.log(product);
      console.log(newQuantity);

      console.log('kiki');
      if (!user || product.stock <= 0) {
          // Handle user not found or product not available
          if(user){
            console.log(user.name);
          }
          if(product){
            console.log(product.name);
          }
          if(product){
            console.log(product.stock);
          }
          req.session.cartProduct = true;
          // res.send('<h1>gcggfcgf</h1>')
          return res.redirect(`/productdetails/${req.params.id}`);
      }
      console.log(user.name);
      let cartItem = await CartDB.findOne({ userId: user._id, productId: product._id });
      console.log(cartItem)
      console.log('lolo')

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

    console.log(productIdToRemove);
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







// duplicate for editing
// const cartPage = async (req, res) => {
//   const isLogged = determineIsLogged(req.session);
//   const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
//   const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;



//   try {
//       const user = await UserDB.findOne({ email: emailId });
//       if (!user) {
//           return res.status(404).send('User not found');
//       }
//       const currentDate = new Date(); // Get the current date
//       // Fetch available coupons for the user
//       const coupons = await CouponDB.find({
//           isAvailable: true,
//           userIds: { $not: { $in: [user._id] } },
//           expiryDate: { $gt: currentDate } // Filter by expiry date greater than current date

//       });
//       console.log(coupons);
//       // return

//       const cartItems = await CartDB.find({ userId: user._id });
//       if (cartItems.length > 0) {
//           const productIds = cartItems.map((cartItem) => cartItem.productId);
//           const productsData = await ProductDB.find({
//             _id: { $in: productIds },
//             isAvailable: true,
//         }).populate({
//             path: 'categoryId',
//             match: { isAvailable: true } // Add condition for category's isAvailable field
//         });

//       // Now products only contain items where the associated category is available
      
//         const products = productsData.filter(data => data.categoryId !== null)
//           // Fetch category offers and calculate product offers
//           const categoryOffers = {}; // Store category offers
//           const productOffers = {}; // Store product offers

//           for (const product of products) {
//               const categoryId = product.categoryId._id.toString();
//               const categoryDiscount = product.categoryId.discountPercentage;

//               // Calculate product offer
//               if (product.discountPercentage > 0) {
//                   // Check if expiry date is available and not expired
//                   if (!product.expiryDate || product.expiryDate >= currentDate) {
//                       productOffers[product._id.toString()] = product.discountPercentage;
//                   }
//               }

              
//               if (product.categoryId.startDate && product.categoryId.endDate) {
//                 const startDate = new Date(product.categoryId.startDate);
//                 const endDate = new Date(product.categoryId.endDate);

//                   // Check if the current date is within the discount offer period
//                   if (currentDate >= startDate && currentDate <= endDate) {
//                       if (!categoryOffers[categoryId]) {
//                           categoryOffers[categoryId] = {
//                               discountPercentage: categoryDiscount,
//                               categoryName: product.categoryId.name,
//                               products: [],
//                           };
//                       }
//                       categoryOffers[categoryId].products.push(product);
//                   }
//               } else {
//                   // If start and end dates are not available, consider the offer as permanent
//                   if (!categoryOffers[categoryId]) {
//                       categoryOffers[categoryId] = {
//                           discountPercentage: categoryDiscount,
//                           categoryName: product.categoryId.name,
//                           products: [],
//                       };
//                   }
//                   categoryOffers[categoryId].products.push(product);
//               }





//           }

//           // Generate detailed cart items with offers applied
//           const detailedCartItems = cartItems.map((cartItem) => {
//               const product = products.find((p) => p._id.equals(cartItem.productId));

//               if(!product){
//                 return null
//               }

              

//               const categoryId = product.categoryId._id.toString();

//               // Calculate total price after applying product discount and category discount
//               let price = cartItem.price;
//               let categoryDiscount = 0;
//               let productDiscount = 0;

//               // Apply product discount if available
//               if (productOffers[product._id.toString()]) {
//                   productDiscount = productOffers[product._id.toString()];
//                   price -= (price * productDiscount) / 100;
//               }

//               // Apply category discount if available
//               if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
//                   categoryDiscount = categoryOffers[categoryId].discountPercentage;
//                   price -= (price * categoryDiscount) / 100;
//               }


//               const categoryOffer = categoryDiscount > 0 ? (categoryDiscount * price) / 100 : null;

// const productOffer = productDiscount > 0 
//     ? (categoryOffer !== null ? (productDiscount * categoryOffer) / 100 : (productDiscount * price) / 100) 
//     : null;


//               return {
//                   productId: cartItem._id,
//                   name: product.name,
//                   images: product.image,
//                   stock: product.stock,
//                   quantity: cartItem.quantity,
//                   unitPrice: product.price,
//                   price:cartItem.price,
//                   description: product.description,
//                   isAvailable: product.isAvailable,
//                   categoryOffer ,
//                   productOffer ,
//                   categoryDiscountPecentage: categoryDiscount > 0 ? categoryDiscount : null,
//                   productDiscountPercentage:productDiscount > 0 ?  productDiscount : null,
//                   totalPrice:price,
//               };


              


//             })
//             .filter(item => item !== null);


            



//             console.log('-=-=-detailedCartItems=-=-=-');

//             console.log(detailedCartItems);

//             console.log('-=-=-detailedCartItems=-=-=-');


//           // Calculate total price
//           let totalPrice = detailedCartItems.reduce((total, item) => total + item.totalPrice, 0)

//           // Apply tax
//           const taxValue = 10.00; // You can change this to your actual tax value
//           const grandTotal =Math.round( totalPrice + taxValue)
//           console.log(grandTotal);

//           res.render('user/cart', {
//               cartItems: detailedCartItems,
//               isLogged,
//               primaryCategories,
//               otherCategories,
//               totalPrice,
//               taxValue,
//               grandTotal,
//               coupons,
//               categoryOffers,
//               productOffers,
//           });
//         } else {
//           res.render('user/cart', { isLogged, primaryCategories, otherCategories, coupons });
//         }
//   } catch (err) {
//       res.status(500).send('Internal Server Error right now');
//   }
// };


























const updateQuantity = async (req, res) => {
  console.log("--=-=====-===----====-----=====---=======");
  const { productId, newQuantity } = req.body;
  // productId means cart id  ==  _id
  // console.log(productId ,newQuantity);
  
  try {

    if (!productId || !newQuantity || isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    const user = await UserDB.findOne({ email: emailId });
    const cartItem = await CartDB.findOne({_id:productId });
    
    const productData = await productDB.findOne({ _id: cartItem.productId }).populate({
      path: 'categoryId',
      match: { isAvailable: true } // Add condition for category's isAvailable field
  });
console.log('hoooi');
  
if(productData.categoryId == null || productData.isAvailable ==false ){
  console.log(90);
  return res.status(404).json({ message: 'Product not found' });
}

if( productData.stock< newQuantity){
  return res.status(404).json({message:'out of stock'})
}





// Initialize the final price with the original price of the product
let finalPrice =   productData.price;


if(newQuantity<=productData.stock){
  cartItem.quantity = newQuantity;
  cartItem.price = (newQuantity) * productData.price
  await cartItem.save();
}




// Apply category discount percentage if available
if (productData.categoryId.discountPercentage > 0) {
  const currentDate = new Date();
  let startDate = null;
  let endDate = null;
  // Check if startDate and endDate exist before creating Date objects
  if (productData.categoryId.startDate) {
      startDate = new Date(productData.categoryId.startDate);
  }
  if (productData.categoryId.endDate) {
      endDate = new Date(productData.categoryId.endDate);
  }
  // Check if the current date falls within the offer period
  if (!startDate || (currentDate >= startDate && currentDate <= endDate)) {
      finalPrice -= (finalPrice * productData.categoryId.discountPercentage) / 100;
  }
}



if (productData.discountPercentage && productData.discountPercentage > 0) {
  const currentDate = new Date();
  const expiryDate = productData.expiryDate ? new Date(productData.expiryDate) : null;

  if (!expiryDate || currentDate <= expiryDate) {
      finalPrice -= (finalPrice * productData.discountPercentage) / 100;
  }
}

// Ensure the final price is not negative
// finalPrice = Math.max(0, finalPrice)*newQuantity
// Ensure the final price is not negative and round to the nearest integer
finalPrice = Math.round(Math.max(0, finalPrice) * newQuantity);


// Now 'finalPrice' contains the calculated price after applying all discounts
console.log('Final Price:', finalPrice);

//========== here the code correct rest of the code is more correction needs

console.log('-=-=-=-cart items -=-=-=-');
// const cartItems = await CartDB.find({ userId: user._id });
const cartItems = await CartDB.find({ userId: user._id, productId: { $ne: productData._id } });

const productIds = cartItems.map((cartItem) => cartItem.productId);
const productsData = await ProductDB.find({
  _id: { $in: productIds },
  isAvailable: true,
}).populate({
  path: 'categoryId',
  match: { isAvailable: true } // Add condition for category's isAvailable field
});

console.log(2, 'find product in productDb');
// console.log(productsData);

// Now products only contain items where the associated category is available
const products = productsData.filter(data => data.categoryId !== null);

// Fetch category offers and calculate product offers
console.log(3, 'find product in productDb');

const categoryOffers = {}; // Store category offers
const productOffers = {}; // Store product offers




for (const product of products) {
  const categoryId = product.categoryId._id.toString();
  const categoryDiscount = product.categoryId.discountPercentage;

  console.log('product offer :',product.discountPercentage);

  // Calculate product offer
  if (product.discountPercentage > 0) {
    // Check if expiry date is available and not expired

    console.log('koko');
    const currentDate = new Date()
    if (!product.expiryDate || product.expiryDate >= currentDate) {
    console.log('koko',1);

      productOffers[product._id.toString()] = product.discountPercentage;
    // console.log('koko',2,  currentDate );
    console.log('koko',2,   );
    

    }
  }

  console.log('9090', 989);

  if (product.categoryId.startDate && product.categoryId.endDate) {
    const currentDate = new Date()

    console.log('ioioi');
    const startDate = new Date(product.categoryId.startDate);
    const endDate = new Date(product.categoryId.endDate);

    // Check if the current date is within the discount offer period
    if (currentDate >= startDate && currentDate <= endDate) {
      if (!categoryOffers[categoryId]) {
        categoryOffers[categoryId] = {
          discountPercentage: categoryDiscount,
          categoryName: product.categoryId.name,
          products: [],
        };
      }
      categoryOffers[categoryId].products.push(product);
    }
  } else {
    // If start and end dates are not available, consider the offer as permanent
    if (!categoryOffers[categoryId]) {
      categoryOffers[categoryId] = {
        discountPercentage: categoryDiscount,
        categoryName: product.categoryId.name,
        products: [],
      };
    }
    categoryOffers[categoryId].products.push(product);
  }
}

console.log('hai-=-=-=-',505);
console.log(productOffers);

// Generate detailed cart items with offers applied
const detailedCartItems = cartItems.map((cartItem) => {
  const product = products.find((p) => p._id.equals(cartItem.productId));

  if (!product) {
    return null;
  }

  const categoryId = product.categoryId._id.toString();

  // Calculate total price after applying product discount and category discount
  let price = cartItem.price;
  let categoryDiscount = 0;
  let productDiscount = 0;

  // Apply product discount if available
  if (productOffers[product._id.toString()]) {
    productDiscount = productOffers[product._id.toString()];
    price -= (price * productDiscount) / 100;
  }

  // Apply category discount if available
  if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
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
    // Include category offer and product offer details if available
    categoryOffer: categoryDiscount > 0 ? { discountPercentage: categoryDiscount, categoryName: categoryOffers[categoryId].categoryName } : null,
    productOffer: productDiscount > 0 ? { discountPercentage: productDiscount } : null,
  };
}).filter(item => item !== null);

// Calculate total price from detailedCartItems
const totalPrice = detailedCartItems.reduce((total, item) => total + item.price, 0);
// const totalPrice = Math.floor(totalPriceFind);

// Now totalPrice contains the sum of prices from detailedCartItems

// Calculate total price

// Apply tax
const taxValue = 10.00; // You can change this to your actual tax value


console.log('Total Price:', totalPrice);
 const subTotal = Math.round( totalPrice + finalPrice)
console.log(subTotal);
console.log('updated product price :',finalPrice);
const grandTotal =Math.round(  totalPrice + taxValue + finalPrice)
console.log("grandTotal :", grandTotal);

return res.json({
  cartItems: detailedCartItems,
  totalPrice,
  taxValue,
  subTotal,
  grandTotal,
  outOfStock:false,
  newQuantity: newQuantity,
  finalPrice: finalPrice,
});

    // Optionally, you may send a success message
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
