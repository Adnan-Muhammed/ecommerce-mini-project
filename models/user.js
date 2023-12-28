const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/Mini-Project')


.then(()=>{
    console.log('mongodb connected');
}).catch(()=>{
    console.log('mongodb connection failed');
})
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
        }   
    }
)



//model create
const userDB=new mongoose.model('userCollection',userSchema)




module.exports=userDB
