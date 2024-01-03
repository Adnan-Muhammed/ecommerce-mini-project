// const CategoryDB=require('../../models/category')
const CategoryDB=require('../models/category')
const productDB = require('../models/product');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'public/uploads/' }); 


const productlist=async (req,res)=>{
    try{
        const productList=await productDB.find()
        console.log(productList.length);
        if(productList.length>0){
            console.log('listed',productList);
            res.render('admin/productlist',{productList})
        }else{
            console.log('NO DATA');
            res.render('admin/categorylist')
        }
        const categoryList=await CategoryDB.find()
        res.render('admin/productlist', { categoryList });
    }catch (err){
        console.error('sorry');
    }
}



const addProduct=async(req,res)=>{
    try{
        console.log('rrrrr');
        const categoryList=await CategoryDB.find({isAvailable:true},{name:1,_id:0})
    res.render('admin/addproduct',{categoryList})
    }catch(err){
        console.error(err);
    }
}


const productadded = async (req, res) => {
    upload.array('images', 6)(req, res, async function (err) {
    console.log("productCategory" , req.body.productCategory)
    console.log(111111,"productDescription",req.body.productDescription)
    if (err instanceof multer.MulterError) {
            return res.status(400).send({ message: 'Multer error' });
        } else if (err) {
            return res.status(500).send({ message: 'Server error' });
        }
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).send({ message: 'No files were uploaded.' });
            }
            const newImages = req.files.map(file => file.path.substring(6))
            const newProduct = {
                name: req.body.productName,
                price: req.body.productPrice,
                stock: req.body.productStock,
                categoryName: req.body.productCategory,
                description: req.body.productDescription,
                image: newImages, 
            };
            await productDB.insertMany([newProduct])
            req.session.productAdded=newProduct
            return res.redirect('/admin/productlist');
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Error adding product' });
        }
    });
};





module.exports={
    addProduct,
    productadded,
    productlist,
}