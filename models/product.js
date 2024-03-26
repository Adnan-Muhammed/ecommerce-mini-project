const mongoose=require('../database/mongodbConnect')

//schema setup
const  productSchema=new  mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true,
        },
        stock:{
            type:Number,
            required:true
        },
        
        categoryId: {  // Change to categoryId
            type: mongoose.Schema.Types.ObjectId,  // Store ObjectId reference
            ref: 'categoryCollections',  // Reference to category model
            required: true
        },
        description:{
            type:String,
            required:true
        },
        image:[String],
        isAvailable:{
            type:Boolean,
            default:true
        },
        discountPercentage: {
            type: Number,
            default: 0  // Default discount percentage to 0
        },
        expiryDate:{
            type:Date,
        }
    }
)
//model create
const productDB=new mongoose.model('productDB',productSchema)

module.exports=productDB
