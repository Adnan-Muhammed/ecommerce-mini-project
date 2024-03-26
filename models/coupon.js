// const mongoose=require('../database/mongodbConnect')



// //schema setup
// const  couponSchema=new  mongoose.Schema(
//     {
//         name:{
//             type:String,
//             unique:true,
//         },
//         discountValue:{
//             type:Number,
//             required:true,
//         },

//         isAvailable:{
//             type:Boolean,
//             default:true,
//         },
    
//     userIds: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'userCollection' // Assuming you have a User model
//     }]
//     }
// )
// //model create
// const CouponDB=new mongoose.model('couponCollections',couponSchema)

// module.exports=CouponDB







const mongoose = require('mongoose');

// Define the schema for the coupon
const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: Date, // Store as a Date object
        // required: true
    },
    userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userCollection' // Assuming you have a User model
    }]
});


// Create the Coupon model using the schema
const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;

