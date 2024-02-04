const UserDB = require('../models/user');
const ProductDB = require('../models/product')
const CartDB = require('../models/cart')
const OrderDB = require('../models/order')

const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');
const { log } = require('console');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};




// const placeOrder = async (req, res) => {
//   const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;

//   try {
//     const {selectedAddress,orderItems,shipping,tax,grandTotal,} = req.body.orderData;
//  // console.log(77777);
//  // console.log(orderItems);
//  // console.log(6666);

//     // for (const { productId, quantity } of orderItems) {
//     //   await ProductDB.( productId, quantity );
//     //  }

//     //update  product stock when order placed
//     for (const { productId, quantity } of orderItems) {
//       await ProductDB.findOneAndUpdate(
//         { _id: productId },
//         { $inc: { stock: -quantity } },
//         // { new: true } // Return the updated document
//       );
//     }




//     const user = await UserDB.findOne(
//       { email: emailId },
//       { _id: 1, billingDetails: { $elemMatch: { _id: selectedAddress } } }
//     );

//     await CartDB findOneAndDelete({userId})

//     const billingAddress=user.billingDetails[0]
   



//     // Create a new order using the OrderDB model
//     const newOrder = new OrderDB({
//       userId: user._id, 
//       billingAddress:billingAddress, 
//       orderItems, 
//       shipping,
//       tax,
//       grandTotal,
//       // paymentMethod: orderDetails.paymentMethod,
//       // paymentStatus: orderDetails.paymentStatus,
//       // orderStatus: orderDetails.orderStatus,
//     });
//  // console.log(99999);
//  // console.log(newOrder)
//  // console.log(787);

//     // Save the new order to the database
//     const savedOrder = await newOrder.save();

//     res.status(201).json(savedOrder);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal Server Error');
//   }
// };



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

 // console.log(user._id);
 // console.log('rrrr',5555);

    // cart updation
    await CartDB.findOneAndDelete({userId:user._id})


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

module.exports={
   
    placeOrder,
    orderPlacedSuccess,
    orderUpdates,
}