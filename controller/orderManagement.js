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
       console.log(orderList);


    res.render('admin/orderlist',{orderList})

  }catch(err){

  }
}

const orderStatus = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const newStatus = req.body.status;

      console.log(orderId);
      console.log(newStatus);

      const updatedOrder = await OrderDB.findByIdAndUpdate(
          orderId,
          { $set: { 'orderStatus.type': newStatus } },
      );

      if (updatedOrder) {
        console.log('Order status updated successfully:', updatedOrder.orderStatus.type);
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
 







module.exports={
   
    placeOrder,
    orderPlacedSuccess,
    orderUpdates,
    orderStatus ,
}