const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/Mini-Project')


.then(()=>{
    console.log('mongodb connected  categoryDB');
}).catch(()=>{
    console.log('mongodb connection failed');
})


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
