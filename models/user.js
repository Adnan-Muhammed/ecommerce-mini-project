const mongoose=require('../database/mongodbConnect')

//schema setup

const  userSchema=new  mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        },
        isBlocked:{
            type:Boolean,
            default:false
        },
        otp:{
            type:String,
            
        } 
    }
)
//model create
const userDB=new mongoose.model('userCollection',userSchema)





// Delete all documents except the ones identified by their _id



module.exports=userDB
