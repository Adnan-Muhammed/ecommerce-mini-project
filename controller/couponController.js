const UserDB = require("../models/user");

const CouponDB =  require('../models/coupon')




const determineIsLogged = (session) => {
  return session.user
    ? session.user.name
    : session.userNew
    ? session.userNew.name
    : null;
};





   
const addCoupon=(req,res)=>{
    res.render('admin/add-coupon')
}



const couponlist=async (req,res)=>{
    try{
        const coupons=await CouponDB.find()
        if(coupons.length>0){
            




            res.render('admin/coupon-list',{coupons})
        }else{
            res.render('admin/coupon-list')
            }
        }catch (err){
          req.redirect('/error')
        }
}





const couponAdding = async (req, res) => {

    const { couponName,discountPrice,expiryDate } = req.body;

    try {
        const existingCoupon = await CouponDB.findOne({ name: couponName });
        if (existingCoupon) {
            return res.status(400).json({ errors: [{ msg: 'Coupon already exists' }] });
        }


        const parts = expiryDate.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Subtract 1 from the month because months in JavaScript Date objects are zero-indexed
        const year = parseInt(parts[2], 10);
        // const dateObject = new Date(year, month, day);
        const dateObject = new Date(year, month, day, 23, 59, 59, 999); // Set the time to 23:59:59.999


        
        // Create a new coupon
        const newCoupon = new CouponDB({
            name: couponName,
            discountValue: discountPrice,
            expiryDate:dateObject,
        });

        // Save the new coupon to the database
        await newCoupon.save();

        // Respond with success message
        res.status(200).json({ message: 'Coupon added successfully' });
    } catch (err) {
        res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
};






const deleteCoupon = async (req, res) => {
    try {
      const couponId = req.body.couponId || req.query.couponId;
      if (!couponId) {
        return res.status(400).json({ error: 'Coupon ID is required' });
      }
      const deletedCoupon = await CouponDB.findByIdAndDelete(couponId);
      if (!deletedCoupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };


  
const show = async (req, res) => {
    try {
      const couponId = req.body.couponId || req.params.couponId;

      if (!couponId) {
        return res.status(400).json({ error: 'Coupon ID is required !' });
      }
      const deletedCoupon = await CouponDB.findOneAndUpdate({_id:couponId},{ $set: { isAvailable: true } });
      if (!deletedCoupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const hide = async (req, res) => {
    try {
      const couponId = req.body.couponId || req.params.couponId;
      if (!couponId) {
        return res.status(400).json({ error: 'Coupon ID is required' });
      }
      const deletedCoupon = await CouponDB.findOneAndUpdate({_id:couponId},{ $set: { isAvailable: false } });
      if (!deletedCoupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };













const availableCoupon = async (req, res) => {
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try {
        const user = await UserDB.findOne({ email: emailId }, { _id: 1, name: 1, email: 1 });
        const currentDate = new Date(); // Get the current date
const coupons = await CouponDB.find({
    userIds: { $not: { $in: [user._id] } },
    expiryDate: { $gt: currentDate } // Filter by expiry date greater than current date
}, {
    _id: 1,
    name: 1,
    userId: 1,
    discountValue: 1,
    expiryDate: 1 // Include expiryDate field in the projection
});



        res.render('user/coupons', { coupons, user });
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
}





const editCoupon=  async (req,res)=>{
    try{
        const couponId=req.params.id
        const coupon = await CouponDB.findById(couponId)
        
        const formattedExpiryDate = new Date(coupon.expiryDate).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        res.render('admin/edit-coupon',{coupon,formattedExpiryDate})
    } catch (err){
      res.redirect('/error')        
    }
}


const editCouponPost = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await CouponDB.findById(couponId);
        if (req.body.couponName) {
            coupon.name = req.body.couponName;
        }
        if (req.body.discountPrice) {
            coupon.discountValue = req.body.discountPrice;
        }
        if (req.body.expiryDate) {
            const {expiryDate} =req.body
            const parts = expiryDate.split('/');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Subtract 1 from the month because months in JavaScript Date objects are zero-indexed
            const year = parseInt(parts[2], 10);
            const dateObject = new Date(year, month, day);
            coupon.expiryDate = dateObject
        }
        await coupon.save();
        res.status(200).json({ message: "Coupon updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update coupon" });
    }
};





module.exports={
    addCoupon,
    couponlist,
    couponAdding,
    deleteCoupon,
    availableCoupon,
    show,
    hide,
    editCoupon,
    editCouponPost,
}