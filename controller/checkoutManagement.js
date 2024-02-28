const UserDB = require('../models/user');
const ProductDB = require('../models/product')
const CartDB = require('../models/cart')
// const CategoryDB = require('../models/')

const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};





const checkoutPage = async (req, res) => {
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  
    try {
      const user = await UserDB.findOne({ email: emailId });
   // console.log(123456789);
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      const cartItems = await CartDB.find({ userId: user._id });
      if(cartItems.length>0){

        const productIds = cartItems.map(cartItem => cartItem.productId);
      const products = await ProductDB.find({ _id: { $in: productIds } });
      const detailedCartItems = cartItems.map(cartItem => {
        const product = products.find(p => p._id.equals(cartItem.productId));
        if(product.stock>=1){
          return {
            _id:cartItem._id,
            userId:cartItem.userId,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name:product.name,
            images: product.image,
            stock: product.stock,
            unitPrice: product.price,
            price:cartItem.price,
            description: product.description,
            isAvailable: product.isAvailable,
          };
        }else{
          return null;
        }
      });
      
    
  // console.log(987654321);
      let totalPrice = 0;
    // for (const cartItem of detailedCartItems) {
    //     totalPrice += cartItem.price;
    //     }

    for (const cartItem of detailedCartItems) {
      if (cartItem && cartItem.stock >= 1) { // Check if cartItem exists and stock is greater than or equal to 1
          totalPrice += cartItem.price;
      }
  }


      const taxValue = 10.00; // You can change this to your actual tax value
      const grandTotal = totalPrice + taxValue
      const billingDetails = user.billingDetails || []; 
   // console.log('hello welcome checkout page');
   // console.log(detailedCartItems[0].images[0]);

      res.render('user/checkout', { cartItems: detailedCartItems.filter(Boolean), billingDetails ,isLogged, primaryCategories, otherCategories ,totalprice:totalPrice,taxValue, grandTotal });
      }else{

     // console.log(9999999912345678);
        res.redirect('/error')
      }
            
    } catch (err) {
      // console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error');
    }
  };
  






  const addAddress = async (req, res) => {
    try {
        const { name, telephone, homeAddress, city, postcode, state } = req.body.formObject;
        const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
        const user = await UserDB.findOne({ email: emailId });
        if (user) {
            const billingDetails = {
                name,
                telephone,
                address: homeAddress,
                city,
                postCode: postcode,
                regionState: state,
            };
            const updatedUser = await UserDB.findOneAndUpdate(
              { email: emailId },
              { $push: { 'billingDetails': billingDetails } },
              { new: true } // Return the modified document
          );

       // console.log('User updated with billing details:', updatedUser);

          // If you want to send a JSON response
          res.status(200).json({ message: 'Form data received successfully' });
      } else {
          // If the user is not found
          res.status(404).json({ error: 'User not found' });
      }
  } catch (error) {
      console.error('Error adding billing details:', error);
      // If there is an internal server error
      res.status(500).json({ error: 'Internal server error' });
  }
};


const removeBillingAddress =async  (req,res)=>{
  const userId = req.params.userId
  const addressId = req.params.addressId
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  console.log(addressId);
  console.log(userId);
  try {
    await UserDB.findOneAndUpdate(
      { _id: userId },
      { $pull: { billingDetails: { _id: addressId } } }
    );
    res.status(200).json({ message: 'Billing address removed successfully' });
  } catch (err) {
    console.error('Error removing billing address:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};






module.exports={
    checkoutPage,
    addAddress,
    removeBillingAddress,
}
