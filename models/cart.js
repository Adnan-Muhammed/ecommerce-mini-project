const mongoose = require('../database/mongodbConnect');

// Schema setup
const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userCollection',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'productDB',
    required: true,
  },
  stock:{
    type :Number,
  },
  quantity: {
    type: Number,
  },
  price: {
    type: Number, // Add a field to store the price for this cart item
  },
});

// Model create
const CartDB = mongoose.model('cartItemCollection', cartItemSchema);

module.exports = CartDB;
