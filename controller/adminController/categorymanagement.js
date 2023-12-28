const session = require('express-session');
const CategoryDB = require('../../models/category');






const categorylist=async (req,res)=>{
    if(req.session.AdminsId){
        try{
            req.session.categoryAdded=null
    const categoryList=await CategoryDB.find()

    if(categoryList.length>0){
        console.log('listed');
        res.render('admin/categorylist',{categoryList})
    }else{
        console.log('NO DATA');
        res.render('admin/categorylist')
    }
            // return res.render('admin/categorylist')
        
    }catch (err){
        console.error(err);
    }
    }
    
}




const addCategory=(req,res)=>{
    if(req.session.AdminsId){
        res.render('admin/addCategory')
    }
  
}




const categoryAddedPost= async (req,res)=>{
    console.log('req.session.AdminsId');
    if(req.session.AdminsId){
    try{
        const categoryData={
            name:req.body.categoryName.trim().toUpperCase()
        }
        await CategoryDB.insertMany([categoryData]);
        // req.session.categoryAdded=true
            res.redirect('/admin/categorylist')
    }catch (err){
        console.error(err);
    }
}
}





const hide=  async (req,res)=>{
if(req.session.AdminsId){
    console.log(req.session.AdminsId,1111);
    console.log('middleware1');

        console.log('middleware2');

        try{
            // console.log(req.params.id);
            console.log(3333333333333);
            const categoryIdToUpdate=req.params.id
            const categoryName=await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            const updatedCategory = await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: false } });
    res.redirect('/admin/categoryList')
        } catch (err){
            console.error(err);
        }
}
}


const show=  async (req,res)=>{

    if(req.session.AdminsId){
        try{
            console.log("show hb");
            const categoryIdToUpdate=req.params.id
            const categoryName=await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            console.log(categoryName);
            const updatedCategory = await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: true } });
    // console.log(updatedCategory);
    res.redirect('/admin/categoryList')
        } catch (err){
            console.error(err);
        }
    }  
    }
       









module.exports={
    categorylist,
    addCategory,
    categoryAddedPost,
    show,
    hide,
}