const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/Mini-Project')


.then(()=>{
    console.log('mongodb connected  product Schema');
}).catch(()=>{
    console.log('mongodb connection failed');
})
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
