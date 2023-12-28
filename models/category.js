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
        }
    }
)
//model create
const CategoryDB=new mongoose.model('categoryCollections',categorySchema)

module.exports=CategoryDB
