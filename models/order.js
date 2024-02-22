const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'usercollections', // Reference to the user model
    required: true,
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
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'cash_on_delivery', 'other'],
      default:'cash_on_delivery',
      required: true,
    },
    // details: {
    //   type: String,
    //   required: true,
    // },
  },
  paymentStatus: {
    type: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'other'],
      default:'pending',
      required: true,
    },
    // details: {
    //   type: String,
    // },
  },
  orderStatus: {
    type: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'other'],
      default:'processing',
      required: true,
    },
    // details: {
    //   type: String,
    // },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const OrderDB = mongoose.model('Order', orderSchema);

module.exports = OrderDB;
