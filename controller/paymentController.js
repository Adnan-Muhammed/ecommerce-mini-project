const UserDB = require("../models/user");
const ProductDB = require("../models/product");
const CartDB = require("../models/cart");
const OrderDB = require("../models/order");
const Razorpay = require('razorPay')



const OrderPayment = async (req, res) => {
  try {
    const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;

    const user = await UserDB.findOne({ email: emailId ,isBlocked:false});
    if (!user) {
    

      return res.status(404).json({ message: 'now this user is blocked by admin' });
    }


    const { amount } = req.body;
    var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET });
    var options = {
      amount: amount , // Convert amount to the smallest currency unit (e.g., paise in INR)
      currency: "INR",
      receipt: "order_rcptid_11",
    };



    // Creating the order
    instance.orders.create(options, function (err, order) {

      if (err) {
        res.status(500).send("Error creating order");
        return;
      }
      

      res.send({ orderId: order.id });

    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};







module.exports={
    OrderPayment
}