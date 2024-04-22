const UserDB = require('../models/user');
const ProductDB = require('../models/product')
const CartDB = require('../models/cart')
const CategoryDB = require('../models/category')
const CouponDB = require('../models/coupon')

const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};






const checkoutPage = async (req, res) => {
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  
    try {
      const currentDate = new Date()
      const user = await UserDB.findOne({ email: emailId });
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      const coupons = await CouponDB.find({
        isAvailable: true,
        userIds: { $not: { $in: [user._id] } },
        expiryDate: { $gte: new Date() } // Check if the expiry date is greater than or equal to the current date
      },
      {
        _id: 1,
        name: 1,
        userId: 1,
        discountValue: 1,
        isAvailable: 1
      },
      { new: true });
  
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
        const products = productsData.filter(data => data.categoryId !== null);
  
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
            // Check if the product doesn't have a product offer
            if (!productOffers[product._id.toString()]) {
              categoryDiscount = categoryOffers[categoryId].discountPercentage;
              price -= (price * categoryDiscount) / 100;
            }
          }
  
          return {
            _id: cartItem._id,
            productId: product._id,
            quantity: cartItem.quantity,
            name: product.name,
            images: product.image,
            stock: product.stock,
            unitPrice: product.price,
            description: product.description,
            isAvailable: product.isAvailable,
            // Include category offer and product offer details if available
            categoryOfferPercentage: categoryDiscount > 0 ? categoryDiscount : null,
            productOfferPercentage: productDiscount > 0 ? productDiscount : null,
            price: Math.round(price)
          };
        }).filter(item => item !== null);
  
        // Calculate total price
        let totalPrice = detailedCartItems.reduce((total, item) => total + item.price, 0);
  
        // Apply tax
        const taxValue = 10.00; // You can change this to your actual tax value
        const deliveryCharge = 50.00
        const grandTotal = totalPrice + taxValue + deliveryCharge
  
        const billingDetails = user.billingDetails || [];
  
        res.render('user/checkout', {
          cartItems: detailedCartItems,
          billingDetails,
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
        res.redirect('/error');
      }
    } catch (err) {
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


          // If you want to send a JSON response
          res.status(200).json({ message: 'Form data received successfully' });
      } else {
          // If the user is not found
          res.status(404).json({ error: 'User not found' });
      }
  } catch (error) {
      // If there is an internal server error
      res.status(500).json({ error: 'Internal server error' });
  }
};


const removeBillingAddress =async  (req,res)=>{
  // const userId = req.params.userId
  const addressId = req.params.addressId
  const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
  try {
    await UserDB.findOneAndUpdate(
      { email: emailId },
      { $pull: { billingDetails: { _id: addressId } } }
    );
    res.status(200).json({ message: 'Billing address removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};




const couponApply = async (req, res) => {
  const coupon = req.body.coupon;
  const totalPrice = req.body.totalPrice;
  const emailId = req.session.user ? req.session.user.email : req.session.userNew.email;

  try {
      const user = await UserDB.findOne({ email: emailId });
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      

      const isCoupon = await CouponDB.findOne({
       name:coupon,
        userIds: { $not: { $in: [user._id] } }
      },
      {
       _id: 1, name: 1, userId: 1, discountValue: 1
        });
        if (!isCoupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

      const couponName = isCoupon.name
      const couponId =isCoupon._id.toString()
      const discountPercentage = isCoupon.discountValue 


      const minTotalPriceForDiscount = 1200;
      const maxDiscountedTotalPrice = 3000;

      if (totalPrice < minTotalPriceForDiscount ) {
        return res.status(404).json({ error: "Minimum order amount for coupon discount is 1200." });
      }

      const discountedTotalPrice = totalPrice >= minTotalPriceForDiscount ?
          (isCoupon && isCoupon.discountValue ?
              totalPrice - Math.min((totalPrice * isCoupon.discountValue) / 100, maxDiscountedTotalPrice)
              : totalPrice)
          : null;
          const discount= (discountedTotalPrice!=null)?discountedTotalPrice-totalPrice:null

      res.status(200).json({ discount ,couponName,couponId,discountPercentage});




  } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
  }
};






module.exports={
    checkoutPage,
    addAddress,
    removeBillingAddress,
    couponApply,
}
