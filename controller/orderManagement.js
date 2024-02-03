const UserDB = require('../models/user');
const ProductDB = require('../models/product')
const CartDB = require('../models/cart')
const OrderDB = require('../models/order')

const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');
const { log } = require('console');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};




const placeOrder = async (req, res) => {
  const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;

  try {
    const {selectedAddress,orderItems,shipping,tax,grandTotal,} = req.body.orderData;


    const user = await UserDB.findOne(
      { email: emailId },
      { _id: 1, billingDetails: { $elemMatch: { _id: selectedAddress } } }
    );

    const billingAddress=user.billingDetails[0]
   



    // Create a new order using the OrderDB model
    const newOrder = new OrderDB({
      userId: user._id, 
      billingAddress:billingAddress, 
      orderItems, 
      shipping,
      tax,
      grandTotal,
      // paymentMethod: orderDetails.paymentMethod,
      // paymentStatus: orderDetails.paymentStatus,
      // orderStatus: orderDetails.orderStatus,
    });
    console.log(99999);
    console.log(newOrder)
    console.log(787);

    // Save the new order to the database
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

  




module.exports={
   
    placeOrder,
}