const UserDB = require("../models/user");
const ProductDB = require("../models/product");
const CartDB = require("../models/cart");
const OrderDB = require("../models/order");
const mongoose = require('mongoose');


const fetchCategoryMiddleware = require("../middleware/fetchCategoryData");
const { log } = require("console");
const CouponDB = require("../models/coupon");
const { logout } = require("./userManagement");

const determineIsLogged = (session) => {
  return session.user
    ? session.user.name
    : session.userNew
    ? session.userNew.name
    : null;
};


//admin orderList
const orderUpdates = async (req, res) => {
  try {
    console.log(898,'lok');
    
    const orderList = await OrderDB.find();
     console.log(orderList);

    res.render("admin/orderlist", { orderList });
  } catch (err) {}
};





// its correct
const placeOrder = async (req, res) => {
  try {
    const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;
    const { selectedAddress, shipping, paymentMethod ,totalValue } = req.body.orderData;
    console.log(req.body.orderData);

    // Extract discountCoupon and discountPrice conditionally
    let discountCouponId, couponDiscount;
    if ('discountCoupon' in req.body.orderData) {
      discountCouponId = req.body.orderData.discountCoupon.trim();
    }
    if ('discountPrice' in req.body.orderData) {
      couponDiscount = req.body.orderData.discountPrice;
    }

    console.log('discountCouponId:', discountCouponId);
    console.log('discountPrice:', couponDiscount);


    console.log('-=-=-=-orderplacing-=-=');
    // return
    // Retrieve user's wallet balance
    const user = await UserDB.findOne({ email: emailId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if payment method is wallet and if user has sufficient balance
    if (paymentMethod === "wallet-payment" && user.wallet < totalValue) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct amount from wallet if payment method is wallet
    if (paymentMethod === "wallet-payment") {
      await UserDB.findOneAndUpdate({ email: emailId }, { $inc: { wallet: -totalValue } });
    }



    
      const cartItems = await CartDB.find({ userId: user._id });
// if (cartItems.length > 0) {
  if(cartItems.length < 1){
    return res.status(404).json({ message: 'error found' });
  }

const currentDate = new Date()
  const productIds = cartItems.map((cartItem) => cartItem.productId);
  const productsData = await ProductDB.find({
    _id: { $in: productIds },
    isAvailable: true,
  }).populate({
    path: "categoryId",
    match: { isAvailable: true }, // Add condition for category's isAvailable field
  });

  // Now products only contain items where the associated category is available

  const products = productsData.filter((data) => data.categoryId !== null);
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
  const detailedCartItems = cartItems
    .map((cartItem) => {
      const product = products.find((p) => p._id.equals(cartItem.productId));

      if (!product) {
        return null;
      }

      const categoryId = product.categoryId._id.toString();

      // Calculate total price after applying product discount and category discount
      let price = cartItem.price;
      let categoryDiscount = 0;
      let productDiscount = 0;
      let categoryOffer = 0;
      let productOffer = 0;

      

      // Apply category discount if available
      if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
        categoryDiscount = categoryOffers[categoryId].discountPercentage;
        categoryOffer = (categoryDiscount * price) / 100
        price -= (price * categoryDiscount) / 100;
        console.log(categoryDiscount,'-=-=-=-=-','-=-=-=-=-',9086);
      }


      // Apply product discount if available
      if (productOffers[product._id.toString()]) {

        productDiscount = productOffers[product._id.toString()];
        productOffer = (productDiscount * price) / 100
        price -= (price * productDiscount) / 100;

      }




      return {
        productId: product._id,
        productName: product.name,
        images: product.image,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        price: cartItem.price,
        description: product.description,
        // isAvailable: product.isAvailable,
        categoryOffer,
        productOffer,
        categoryDiscountPecentage:
          categoryDiscount > 0 ? categoryDiscount : null,
        productDiscountPercentage: productDiscount > 0 ? productDiscount : null,
        totalPrice: price,
      };
    })
    .filter((item) => item !== null);

  console.log("-=-=-detailedCartItems=-=-=-");

  console.log(detailedCartItems);

  console.log("-=-=-detailedCartItems=-=-=-");

  // Calculate total price
  let totalPrice = detailedCartItems.reduce(
    (total, item) => total + item.totalPrice,
    0
    );
  // Apply tax
  const taxValue = 10.0; // You can change this to your actual tax value
  const grandTotalValue = totalPrice + taxValue


  console.log(grandTotalValue);

  console.log('-=-=-=-');
  console.log('-=-=-=-');



  let grandTotal;
  let coupon;
  let couponDiscountValue;


 // is coupon used then  apply grandTotal
  if (discountCouponId) {
   coupon =  await CouponDB.findById( discountCouponId );
   couponDiscountValue =(coupon.discountValue * totalPrice ) /100;
   grandTotal = grandTotalValue - couponDiscountValue
  }else {
      grandTotal = grandTotalValue;
  }
  console.log(grandTotal);

  

  // return

    await CartDB.deleteMany({ userId: user._id });

    // Determine payment status
    const paymentStatus = paymentMethod !== "cash-on-delivery" ? "fulfilled" : undefined;

    // Update coupon if provided
    if (discountCouponId) {
      await CouponDB.findByIdAndUpdate({ _id: discountCouponId }, { $addToSet: { userIds: user._id } });
    }

    // Create new order
    const newOrder = new OrderDB({
      userId: user._id,
      userEmailId: emailId,
      userName:user.name,
      billingAddress: user.billingDetails.find(address => address._id.toString() === selectedAddress),
      orderItems:detailedCartItems,
      shipping,
      tax:taxValue,
      couponId: discountCouponId,
      couponName:coupon ? coupon.name : null,
      couponDiscount:couponDiscountValue,
      couponDiscountPercentage:coupon? coupon.discountValue: null,
      grandTotal,
      paymentMethod: { type: paymentMethod },
      paymentStatus: { type: paymentStatus }
    });

    // Save the order
    const savedOrder = await newOrder.save();





    // Reduce product stock
for (const item of detailedCartItems) {
  const productId = item.productId;
  let purchasedQuantity = item.quantity;

  // Update product stock
  const product = await ProductDB.findByIdAndUpdate(productId, {
    $inc: { stock: -purchasedQuantity }
  },{new:true});

  // Find other carts containing the same product
  const otherCarts = await CartDB.find({ productId: productId, userId: { $ne: user._id } });
  for (const cart of otherCarts) {
   if(cart.quantity> product.stock){
    await CartDB.findByIdAndUpdate(cart._id, { quantity: product.stock ,price:product.price * product.stock,stock:product.stock});
    }
    else{
      await CartDB.findByIdAndUpdate(cart._id, { stock:product.stock});  
    }
}
}
    // Log transaction if payment is fulfilled
    if (paymentStatus === "fulfilled") {
      const transaction = {
        type: 'credit',
        amount: grandTotal,
        timestamp: Date.now()
      };
      user.transactions.push(transaction);
      await user.save();
    }
    // Return success response
    console.log('---__--_____');
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};








const orderPlacedSuccess = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } =
    await fetchCategoryMiddleware.fetchCategories();
  const emailId = req.session.user
    ? req.session.user.email
    : req.session.userNew.email;
  try {
    res.render("user/orderPlaced", { isLogged });
  } catch (err) {}
};







const orderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    console.log(orderId, "admin side");
    console.log(newStatus, "admin side");
    const updatedOrder = await OrderDB.findByIdAndUpdate(
      orderId,
      { $set: { "orderStatus.type": newStatus } },
      { new: true } // To return the updated order document
    );

    if (updatedOrder) {
      console.log("after Update");
      console.log(
        "Order status updated successfully:",
        updatedOrder.orderStatus.type
      ); // cancelled pending what ever
      // Reload the page
      // res.redirect(req.get('referer')); // Redirect to the previous page
      res.redirect("/admin/orderlist");
    } else {
      console.log("Order not found.");
      // res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error("Error updating order status:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const handleOrderStatusUpdate = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const status = req.body.orderStatus;

    const orderDocument = await OrderDB.findById(orderId);
    const userId = orderDocument.userId.toString();
    const productIds = orderDocument.orderItems.map(item => item.productId.toString());

    let orderUpdate;
    let message;

    if (status === "cancelled") {
      orderUpdate = await OrderDB.findByIdAndUpdate(
        orderId,
        { $set: { "orderStatus.type": status } },
        { new: true }
      );

     
      if (!orderUpdate) {
        return res.status(404).json({ message: "Order not found" });
      }

      for (const item of orderDocument.orderItems) {
        const product = await ProductDB.findById(item.productId);
        if (!product) {
          continue; // Skip if product not found
        }
        product.stock += item.quantity; // Return canceled quantity back to stock
        await product.save();
      }

      if (orderDocument.paymentStatus.type === "fulfilled") {
        const user = await UserDB.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        user.wallet += orderDocument.grandTotal; // Return total amount to user wallet
        await user.save();
        // Log the transaction
        const transaction = {
          type: 'credit',
          amount: orderDocument.grandTotal,
          timestamp: Date.now(),
          isReturned:true
        };
        user.transactions.push(transaction);
        await user.save();

        
        orderDocument.paymentStatus.type='returned'
        await orderDocument.save()
        
      }


      // orderUpdate.paymentStatus.type = "returned";
      //   await orderUpdate.save();

      message = "Order cancelled successfully";
    } else if (status === "returned") {
      orderUpdate = await OrderDB.findByIdAndUpdate(
        orderId,
        { $set: { "orderStatus.type": status } },
        { new: true }
      );
      //new adding
      if (!orderUpdate) {
        return res.status(404).json({ message: "Order not found" });
      }
      for (const item of orderDocument.orderItems) {
        const product = await ProductDB.findById(item.productId);
        if (!product) {
          continue; // Skip if product not found
        }
        product.stock += item.quantity; // Return canceled quantity back to stock
        await product.save();
      }

      if (orderDocument.paymentStatus.type === "fulfilled") {
        const user = await UserDB.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        user.wallet += orderDocument.grandTotal; // Return total amount to user wallet
        await user.save();

        // Log the transaction
        const transaction = {
          type: 'credit',
          amount: orderDocument.grandTotal,
          timestamp: Date.now(),
          isReturned:true
        };
        user.transactions.push(transaction);
        await user.save();
      }



      message = "Order returned successfully";






    } else {
      return res.status(400).json({ message: "Invalid order status" });
    }

    console.log("Updated order:", orderUpdate);
    console.log("After updating order status to:", status);

    return res.status(200).json({ message, order: orderUpdate });
  } catch (err) {
    console.error("Error updating order:", err);
    return res.status(500).json({ message: "Failed to update order. Please try again later." });
  }
};






const placeOrderchecking = async (req, res) => {
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
      console.log(coupons);
      // return

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
                  // price: price,
                  price:Math.round( price),
                  description: product.description,
                  isAvailable: product.isAvailable,
                  // Include category offer and product offer details if available
                  categoryOffer: categoryDiscount > 0 ? { discountPercentage: categoryDiscount, categoryName: categoryOffers[categoryId].categoryName } : null,
                  productOffer: productDiscount > 0 ? { discountPercentage: productDiscount } : null,
              };


            })
            .filter(item => item !== null);

          // Calculate total price
          let totalPrice = Math.round(detailedCartItems.reduce((total, item) => total + item.price, 0))

          // Apply tax
          const taxValue = 10.00; // You can change this to your actual tax value
          const grandTotal =Math.round( totalPrice + taxValue)

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

module.exports = {
  placeOrder,
  orderPlacedSuccess,
  orderUpdates,
  orderStatus,
  // cancelOrder,
  handleOrderStatusUpdate,
};
