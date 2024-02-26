const mongoose = require('../database/mongodbConnect');

// Schema setup
const wishlistItemSchema = new mongoose.Schema({
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
 
  
});

// Model create
const WishlistDB = mongoose.model('wishListCollection', wishlistItemSchema);

module.exports = WishlistDB;
