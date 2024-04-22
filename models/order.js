const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'usercollections', // Reference to the user model
    required: true,
  },
  userName:{
    type:String,
    required:true,
  },
  userEmailId: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  billingAddress: {
    name: {
      type: String,
      required: true,
    },
    telephone: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postCode: {
      type: Number,
      required: true,
    },
    regionState: {
      type: String,
      required: true,
    },
  },
  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the product model
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      images: [
        {
          type: String,
        },
      ],
      price: {
        type: Number,
        required: true,
      },
      description:{
        type:String,
      },
      categoryId: {  // Change to categoryId
        type: mongoose.Schema.Types.ObjectId,  // Store ObjectId reference
        ref: 'categoryCollections',  // Reference to category model
        required: true
    },
    categoryName:{
      type:String,
    },
      categoryOffer:{
        type:Number,
      },
      categoryDiscountPecentage:{
        type:Number,
      },
      productOffer:{
        type:Number,
      },
      productDiscountPercentage:{
        type:Number,
      },
      totalPrice:{
        type:Number,
        required:true,
      }
    },
  ],

  shipping: {
    type: String,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    required: true,
  },

  
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'couponCollections', // Reference to the product model
  },
  couponName:{
    type:String,
  },
  couponDiscount:{
    type:Number
  },
  couponDiscountPercentage:{
    type:Number,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ["cash-on-delivery", "online-payment", "wallet-payment"],
      default:"cash-on-delivery",
      required: true,
    },
    
  },
  paymentStatus: {
    type: {
      type: String,
      enum: ['pending', 'fulfilled', 'failed', 'returned'],
      default:'pending',
      required: true,
    },
    
  },
  orderStatus: {
    type: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'returned','failed'],
      default:'processing',
      required: true,
    },
  
  },
  returnReason:{
    type:String
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const OrderDB = mongoose.model('Order', orderSchema);

module.exports = OrderDB;
