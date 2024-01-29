const mongoose = require('../database/mongodbConnect');

const billingDetailsSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
   telephone: {
    type: String,
    required: true,
  },
  Address: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postCode: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
  },
});

const BillingDetailsDB = mongoose.model('billingDetailsCollection', billingDetailsSchema);

module.exports = BillingDetailsDB;