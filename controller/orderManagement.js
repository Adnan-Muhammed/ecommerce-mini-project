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
    
    const orderList = await OrderDB.find();

    res.render("admin/order-list", { orderList });
  } catch (err) {
    res.redirect('/error')
  }
};








const repaymentPlaceOrder = async (req, res) => {
  try {
    const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;
    const { selectedAddress, shipping, paymentMethod ,totalValue ,paymentStatus , } = req.body.orderData;

    

    const user = await UserDB.findOne({ email: emailId ,isBlocked:false});
    if (!user) {

      return res.status(404).json({ message: 'now this user is blocked by admin' });
    }

    // Extract discountCoupon and discountPrice conditionally
    let discountCouponId, couponDiscount;
    if ('discountCoupon' in req.body.orderData) {
      discountCouponId = req.body.orderData.discountCoupon.trim();
    }
    if ('discountPrice' in req.body.orderData) {
      couponDiscount = req.body.orderData.discountPrice;
    }


    
      const cartItems = await CartDB.find({ userId: user._id });
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
      const categoryName = product.categoryId.name; // Fetching the category name


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
        categoryId,
        categoryName,
        categoryOffer,
        productOffer,
        categoryDiscountPecentage:
          categoryDiscount > 0 ? categoryDiscount : null,
        productDiscountPercentage: productDiscount > 0 ? productDiscount : null,
        totalPrice: price,
      };
    })
    .filter((item) => item !== null);


  // Calculate total price
  let totalPrice = detailedCartItems.reduce(
    (total, item) => total + item.totalPrice,
    0
    );
  // Apply tax
  const taxValue = 10.0; // You can change this to your actual tax value
  const grandTotalValue = totalPrice + taxValue



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
  

  // return

    await CartDB.deleteMany({ userId: user._id });





    // Update coupon if provided
    if(paymentStatus != 'failed'){
      if (discountCouponId) {
        await CouponDB.findByIdAndUpdate({ _id: discountCouponId }, { $addToSet: { userIds: user._id } });
      }
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


res.status(201).json(savedOrder)
  } catch (err) {
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
    res.render("user/order-placed", { isLogged });
  } catch (err) {
    res.redirect('/error')
  }
};







const orderPlacedFailed = async (req, res) => {
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } =
    await fetchCategoryMiddleware.fetchCategories();
  const emailId = req.session.user
    ? req.session.user.email
    : req.session.userNew.email;
  try {
    res.render("user/order-failed", { isLogged });
  } catch (err) {
    res.redirect('/error')
  }
};








const orderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    if(newStatus=== "cancelled"){
    const paymentReturn =  await OrderDB.findById(orderId)

    if(paymentReturn.paymentStatus.type=="fulfilled"){


    const userId =   paymentReturn.userId
    const returnPayment = paymentReturn.grandTotal

    const user = await UserDB.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        user.wallet += returnPayment; // Return total amount to user wallet
        await user.save();
        // Log the transaction
        const transaction = {
          type: 'returned',
          amount: returnPayment,
          timestamp: Date.now(),
          isReturned:true
        };
        user.transactions.push(transaction);
        await user.save();



      paymentReturn.paymentStatus.type="returned"
      await paymentReturn.save()


    }
    }



    if(newStatus=== "delivered"){
      const orderPaymentStatus = await OrderDB.findByIdAndUpdate(
        orderId,
        { $set: { "paymentStatus.type": "fulfilled" } },
        { new: true } // To return the updated order document
      );
    }
    const updatedOrder = await OrderDB.findByIdAndUpdate(
      orderId,
      { $set: { "orderStatus.type": newStatus } },
      { new: true } // To return the updated order document
    );

    if (updatedOrder) {
      res.redirect("/admin/orderlist");
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
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

    // cancelled
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
          type: 'returned',
          amount: orderDocument.grandTotal,
          timestamp: Date.now(),
          isReturned:true
        };
        user.transactions.push(transaction);
        await user.save();

        
        orderDocument.paymentStatus.type='returned'
        await orderDocument.save()
        
      }


      message = "Order cancelled successfully";
    } 
    
    
    else if (status === "returned") {
      const { returnReason } =  req.body

      const orderUpdate = await OrderDB.findByIdAndUpdate(
        orderId,
        {
          $set: {
            "orderStatus.type": status,
            returnReason: returnReason
          }
        },
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
          type: 'returned',
          amount: orderDocument.grandTotal,
          timestamp: Date.now(),
          isReturned:true
        };
        user.transactions.push(transaction);
        await user.save();

        orderDocument.paymentStatus.type='returned'
        await orderDocument.save()
      }







      message = "Order returned successfully";






    } else {
      return res.status(400).json({ message: "Invalid order status" });
    }

    return res.status(200).json({ message, order: orderUpdate });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update order. Please try again later." });
  }
};







const placeOrder = async (req, res) => {
  try {
    const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;
    const { selectedAddress, shipping, paymentMethod } = req.body.orderData;
    let paymentStatus;
    if (req.body.orderData.paymentMethod == 'wallet-payment') {
      paymentStatus = "fulfilled";
    } else {
      paymentStatus = req.body.orderData.paymentStatus;
    }

    const hai = req.body.orderData.orderItems[0].isCartId;
    // return

    const user = await UserDB.findOne({ email: emailId, isBlocked: false });
    if (!user) {

      return res.status(404).json({ message: 'now this user is blocked by admin' });
    }

    // Extract discountCoupon and discountPrice conditionally
    let discountCouponId, couponDiscount;
    if ('discountCoupon' in req.body.orderData) {
      discountCouponId = req.body.orderData.discountCoupon.trim();
    }
    if ('discountPrice' in req.body.orderData) {
      couponDiscount = req.body.orderData.discountPrice;
    }

    const cartItems = await CartDB.find({ userId: user._id });
    if (cartItems.length < 1) {
      return res.status(404).json({ message: 'error found' });
    }

    const currentDate = new Date();
    const productIds = cartItems.map((cartItem) => cartItem.productId);
    const productsData = await ProductDB.find({
      _id: { $in: productIds },
      isAvailable: true,
    }).populate({
      path: "categoryId",
      match: { isAvailable: true }, // Add condition for category's isAvailable field
    });

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
        const categoryName = product.categoryId.name;

        // Calculate total price after applying product discount and category discount
        let price = cartItem.price;
        let categoryDiscount = 0;
        let productDiscount = 0;
        let categoryOffer = 0;
        let productOffer = 0;

        // Apply product discount if available
        if (productOffers[product._id.toString()]) {
          productDiscount = productOffers[product._id.toString()];
          productOffer = (productDiscount * price) / 100;
          price -= (price * productDiscount) / 100;
        } else if (categoryOffers[categoryId] && categoryOffers[categoryId].discountPercentage > 0) {
          categoryDiscount = categoryOffers[categoryId].discountPercentage;
          categoryOffer = (categoryDiscount * price) / 100;
          price -= (price * categoryDiscount) / 100;
        }

        return {
          productId: product._id,
          productName: product.name,
          images: product.image,
          quantity: cartItem.quantity,
          unitPrice: product.price,
          price: cartItem.price,
          description: product.description,
          categoryId,
          categoryName,
          categoryOffer,
          productOffer,
          categoryDiscountPecentage: categoryDiscount > 0 ? categoryDiscount : null,
          productDiscountPercentage: productDiscount > 0 ? productDiscount : null,
          totalPrice: price,
        };
      })
      .filter((item) => item !== null);

    // Calculate total price
    let totalPrice = detailedCartItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    // Apply tax and delivery charge
    const taxValue = 10.00; // You can change this to your actual tax value
    const deliveryCharge = 50.00;
    const grandTotalValue = totalPrice + taxValue + deliveryCharge;

    let grandTotal;
    let coupon;
    let couponDiscountValue;

    // If coupon is used, apply coupon discount
    if (discountCouponId) {
      coupon = await CouponDB.findById(discountCouponId);
      couponDiscountValue = (coupon.discountValue * totalPrice) / 100;
      grandTotal = grandTotalValue - couponDiscountValue;
    } else {
      grandTotal = grandTotalValue;
    }

    // Check wallet balance if payment method is wallet
    if (paymentMethod === "wallet-payment" && user.wallet < grandTotal) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct amount from wallet if payment method is wallet
    if (paymentMethod === "wallet-payment") {
      await UserDB.findOneAndUpdate({ email: emailId }, { $inc: { wallet: -grandTotal } });
    }

    await CartDB.deleteMany({ userId: user._id });

    // Create new order
    const newOrder = new OrderDB({
      userId: user._id,
      userEmailId: emailId,
      userName: user.name,
      billingAddress: user.billingDetails.find(address => address._id.toString() === selectedAddress),
      orderItems: detailedCartItems,
      shipping,
      tax: taxValue,
      deliveryCharge: deliveryCharge,
      couponId: discountCouponId,
      couponName: coupon ? coupon.name : null,
      couponDiscount: couponDiscountValue,
      couponDiscountPercentage: coupon ? coupon.discountValue : null,
      grandTotal,
      paymentMethod: { type: paymentMethod },
      paymentStatus: { type: paymentStatus }
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Reduce product stock and update carts
    for (const item of detailedCartItems) {
      const productId = item.productId;
      let purchasedQuantity = item.quantity;

      // Update product stock
      const product = await ProductDB.findByIdAndUpdate(productId, {
        $inc: { stock: -purchasedQuantity }
      }, { new: true });

      // Find other carts containing the same product
      const otherCarts = await CartDB.find({ productId: productId, userId: { $ne: user._id } });
      for (const cart of otherCarts) {
        if (cart.quantity > product.stock) {
          await CartDB.findByIdAndUpdate(cart._id, { quantity: product.stock, price: product.price * product.stock, stock: product.stock });
        } else {
          await CartDB.findByIdAndUpdate(cart._id, { stock: product.stock });
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

    // Update coupon if provided
    if (paymentStatus !== 'failed' && discountCouponId) {
      await CouponDB.findByIdAndUpdate({ _id: discountCouponId }, { $addToSet: { userIds: user._id } });
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};





const repaymentOrder =async (req,res)=>{
  const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;
  const orderId = req.body.orderId
 
try{
  const user = await UserDB.findOne({ email: emailId ,isBlocked:false});
  if (!user) {

    return res.status(404).json({ message: 'now this user is blocked by admin' });
  }

  const orderUpdate = await OrderDB.findByIdAndUpdate(orderId , { "paymentStatus.type": "fulfilled" },  { new: true })
    const transaction = {
      type: 'credit',
      amount: orderUpdate.grandTotal,
      timestamp: Date.now()
    };
    user.transactions.push(transaction);
    await user.save();



  if(orderUpdate.couponId){
    // const couponUsed = await CouponDB.findOneAndUpdate(orderId.couponId,)
    const couponUsed = await CouponDB.findOneAndUpdate({ _id: orderUpdate.couponId }, { $addToSet: { userIds: orderUpdate.userId } }, { new: true });

  }
  return res.json({ message: "Payment is successful" });
}
  catch(err){
    // Handle errors that occur during the update process
    return res.status(500).json({ message: "An error occurred while updating payment status" });
  }

}

module.exports = {
  placeOrder,
  orderPlacedSuccess,
  orderPlacedFailed,
  orderUpdates,
  orderStatus,
  handleOrderStatusUpdate,
  repaymentOrder,
};



