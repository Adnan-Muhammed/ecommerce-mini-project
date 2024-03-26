const mongoose=require('../database/mongodbConnect')



//schema setup
const  categorySchema=new  mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            unique:true,
        },
        isAvailable:{
            type:Boolean,
            default:true,
        },
        discountPercentage:{
            type:Number,
        },
        startDate:{
            type:Date,
        },
        endDate:{
            type:Date,
        }


    }
)
//model create
const CategoryDB=new mongoose.model('categoryCollections',categorySchema)

module.exports=CategoryDB
