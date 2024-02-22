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
 // console.log(77777);
 // console.log(orderItems);
 // console.log(6666);
    // for (const { productId, quantity } of orderItems) {
    //   await ProductDB.( productId, quantity );
    //  }
    //update  product stock when order placed
    for (const { productId, quantity } of orderItems) {
      await ProductDB.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: -quantity } },
        // { new: true } // Return the updated document
      );
    }

    const user = await UserDB.findOne(
      { email: emailId },
      { _id: 1, billingDetails: { $elemMatch: { _id: selectedAddress } } }
    );


    const billingAddress=user.billingDetails[0]



    // cart updation
    await CartDB.deleteMany({ userId: user._id });

    console.log(user.email);
    console.log('updating here');

    // Create a new order using the OrderDB model
    const newOrder = new OrderDB({
      userId: user._id, 
      userEmailId: emailId,
      billingAddress:billingAddress, 
      orderItems, 
      shipping,
      tax,
      grandTotal,
      // paymentMethod: orderDetails.paymentMethod,
      // paymentStatus: orderDetails.paymentStatus,
      // orderStatus: orderDetails.orderStatus,
    });
 // console.log(99999);
 // console.log(newOrder)
 // console.log(787);

    // Save the new order to the database
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

  
const orderPlacedSuccess= async(req,res)=>{
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
try{
res.render('user/orderPlaced',{isLogged })
}catch(err){

}
}



const orderUpdates =async (req,res)=>{
  try{
    const orderList = await OrderDB.find()
      //  console.log(orderList);

    res.render('admin/orderlist',{orderList})

  }catch(err){

  }
}

const orderStatus = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const newStatus = req.body.status;

      console.log(orderId, "admin side");
      console.log(newStatus , "admin side");

      const updatedOrder = await OrderDB.findByIdAndUpdate(
          orderId,
          { $set: { 'orderStatus.type': newStatus } },
          { new: true } // To return the updated order document
          );

      if (updatedOrder) {
        console.log('after Update');
        console.log('Order status updated successfully:', updatedOrder.orderStatus.type);// cancelled pending what ever
        // Reload the page
        // res.redirect(req.get('referer')); // Redirect to the previous page
        res.redirect('/admin/orderlist')
    } else {
          console.log('Order not found.');
          // res.status(404).json({ message: 'Order not found' });
      }
  } catch (err) {
      console.error('Error updating order status:', err.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
}; 
 




// const cancelOrder = async (req, res) => {
//   try {
//       const orderId = req.params.orderId;
//       console.log("orderId:", orderId);
//       const status = req.body.orderStatus

//       // Update order status to 'cancelled' in the database
//       const orderCancel = await OrderDB.findByIdAndUpdate(
//         orderId,
//         { $set: { 'orderStatus.type': status } },
//         { new: true } // To return the updated order document
//       );
//       // Check if orderCancel is null (no order found with the provided ID)
//       if (!orderCancel) {
//           return res.status(404).json({ message: 'Order not found' });
//       }
//       console.log(" haaai 111",orderCancel);
//       console.log('after user updation');
//       console.log(status," what change");
//       console.log(orderCancel.orderStatus);
//       console.log(orderCancel.orderStatus.type);
//       // Respond with the updated order docuyment
//       return res.status(200).json({ message: 'Order cancelled successfully', order: orderCancel });
//   } catch (err) {
//       // Handle any errors that occur during the cancellation process
//       console.error('Error cancelling order:', err);
//       return res.status(500).json({ message: 'Failed to cancel order. Please try again later.' });
//   }
// };

const handleOrderStatusUpdate = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log("orderId:", orderId);
    const status = req.body.orderStatus; // Assuming you're passing the new status in the request body

    let orderUpdate;
    let message;

    // Update order status based on the provided status
    if (status === 'cancelled') {
      // Update order status to 'cancelled' in the database
      orderUpdate = await OrderDB.findByIdAndUpdate(
        orderId,
        { $set: { 'orderStatus.type': status } },
        { new: true } // To return the updated order document
      );
      message = 'Order cancelled successfully';
    } else if (status === 'returned') {
      // Update order status to 'returned' in the database
      orderUpdate = await OrderDB.findByIdAndUpdate(
        orderId,
        { $set: { 'orderStatus.type': status } },
        { new: true } // To return the updated order document
      );
      message = 'Order returned successfully';
    } else {
      // Invalid status provided
      return res.status(400).json({ message: 'Invalid order status' });
    }

    // Check if orderUpdate is null (no order found with the provided ID)
    if (!orderUpdate) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log("Updated order:", orderUpdate);
    console.log('After updating order status to:', status);

    // Respond with the updated order document
    return res.status(200).json({ message, order: orderUpdate });
  } catch (err) {
    // Handle any errors that occur during the update process
    console.error('Error updating order:', err);
    return res.status(500).json({ message: 'Failed to update order. Please try again later.' });
  }
};








module.exports={
   
    placeOrder,
    orderPlacedSuccess,
    orderUpdates,
    orderStatus ,
    // cancelOrder,
    handleOrderStatusUpdate
}