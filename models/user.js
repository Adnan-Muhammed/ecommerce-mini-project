
const mongoose = require('../database/mongodbConnect');

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit', 'debit','returned'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    isReferral: {
        type: Boolean,
        default: false // Assuming most transactions are not by referral
    },
    isReturned: {
        type: Boolean,
        default: false // Assuming most transactions are not by referral
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    referral: {
        type: String
    },
    billingDetails: [{
        name: {
            type: String,
            required: true
        },
        telephone: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postCode: {
            type: Number,
            required: true
        },
        regionState: {
            type: String,
            required: true
        }
    }],
    transactions: [transactionSchema] // Linking transaction schema to user schema
});

// Model creation
const User = mongoose.model('userCollection', userSchema);

module.exports = User;
