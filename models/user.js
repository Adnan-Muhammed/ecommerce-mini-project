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
            },
            
        }]
    }
)
//model create
const userDB=new mongoose.model('userCollection',userSchema)





// Delete all documents except the ones identified by their _id



module.exports=userDB
