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
        categoryName:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        image:[String],
        isAvailable:{
            type:String,
            default:true
        }
    }
)
//model create
const productDB=new mongoose.model('productDB',productSchema)

module.exports=productDB
