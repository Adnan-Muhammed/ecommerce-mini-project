const session = require('express-session');
const CategoryDB = require('../models/category');






const categorylist=async (req,res)=>{
    try{
        const categoryList=await CategoryDB.find()
        if(categoryList.length>0){
            res.render('admin/category-list',{categoryList})
        }else{
            res.render('admin/category-list')
            }
        }catch (err){
            req.redirect('/error')
        }
}







const addCategory=(req,res)=>{
    res.render('admin/add-category')
}


const editCategory=  async (req,res)=>{
    try{
        const categoryId=req.params.id
        const category = await CategoryDB.findById(categoryId)
res.render('admin/edit-category',{category})
    } catch (err){
        req.redirect('/error')
    }
}



const categoryAddedPost= async (req,res)=>{
    try{
        const categoryData={
            name:req.body.categoryName.trim().toUpperCase()
        }
        await CategoryDB.insertMany([categoryData]);
            res.redirect('/admin/categoryList')
    }catch (err){
        req.redirect('/error')

    }
}



const categoryAdding = async (req, res) => {
    try {
        const categoryName = req.body.categoryName.trim().toUpperCase();

        const existingCategory = await CategoryDB.findOne({ name: categoryName });

        if (existingCategory) {
            res.json({ exists: "this category name is existing add another one " }); // Category exists
        } else {
            const filteredData = Object.entries(req.body).reduce((acc, [key, value]) => {
                if (value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});
          
            const { categoryName, discountPercentage,  startDate , endDate } = req.body;

            if (categoryName) {
                let newCategoryData = { name: categoryName };
            
                if (discountPercentage) {
                    newCategoryData.discountPercentage = discountPercentage;
                }
            
                if (startDate && endDate) {
                    const [dayStart, monthStart, yearStart] = startDate.split("/");
                    const startDateModified = new Date(yearStart, monthStart - 1, dayStart);
                    const [dayEnd, monthEnd, yearEnd] = endDate.split("/");
                    const endDateModified = new Date(yearEnd, monthEnd - 1, dayEnd);
                    newCategoryData.startDate = startDateModified;
                    newCategoryData.endDate = endDateModified;
                }
            
                const newCategory = new CategoryDB(newCategoryData);
            
                // Save newCategory to the database
                newCategory.save()

                res.json({ success:"new category added" }); // Category doesn't exist
            }
            }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};









const checkCategory2 = async (req, res) => {
    try {
        const categoryOld = req.body.labelText.trim().toUpperCase();
        const categoryNew = req.body.categoryName.trim().toUpperCase();

        const existingCategory = await CategoryDB.findOne({ name: categoryNew });

        if (existingCategory) {
            res.json({ exists: true }); // Category exists
            console.log("existing");
        } else {
            const newCategory = await CategoryDB.findOneAndUpdate(
                { name: categoryOld },
                { $set: { name: categoryNew } },
                { new: true, upsert: true } // If the category doesn't exist, create a new one
            );
            res.json({ message: 'success' }); // Category doesn't exist
            console.log("not existing");
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const editCategoryPost = async (req, res) => {
    try {
        const startDate = req.body.startDate ? new Date(req.body.startDate.split('/').reverse().join('-')) : undefined;
        const endDate = req.body.endDate ? new Date(req.body.endDate.split('/').reverse().join('-')) : undefined;

        const categoryName = req.body.categoryName.trim().toUpperCase();
        const existingCategories = await CategoryDB.find({ name: categoryName });
        
        if (existingCategories.some(category => category._id.toString() !== req.body.categoryId)) {
            res.json({ exists: "This category name is existing, please add another one." });
            return;
        }
        const updateCategory = await CategoryDB.findById(req.body.categoryId);
        if (!updateCategory) {
            res.status(404).json({ error: "Category not found." });
            return;
        }

        // Update category properties
        updateCategory.name = req.body.categoryName;
        // updateCategory.discountPercentage = req.body.discountPercentage;

        if (req.body.discountPercentage !== undefined) {
            updateCategory.discountPercentage = req.body.discountPercentage;
        } else {
            updateCategory.discountPercentage = undefined;
        }




        // If startDate is undefined, remove it from the category
        if (startDate !== undefined) {
            updateCategory.startDate = startDate;
        } else {
            updateCategory.startDate = undefined;
        }

        // If endDate is undefined, remove it from the category
        if (endDate !== undefined) {
            updateCategory.endDate = endDate;
        } else {
            updateCategory.endDate = undefined;
        }

        await updateCategory.save();
        res.json({ success: "Category updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};









const hide=  async (req,res)=>{
        try{
            const categoryIdToUpdate=req.params.id
            await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: false } });
    res.redirect('/admin/categoryList')
        } catch (err){
            console.error(err);
            res.redirect('/error')
        }

}


const show=  async (req,res)=>{
        try{
            const categoryIdToUpdate=req.params.id
            await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: true } });
    res.redirect('/admin/categoryList')
        } catch (err){
            res.redirect('/error')
        }
    }
       









module.exports={
    categorylist,
    addCategory,
    editCategory,
    categoryAddedPost,
    show,
    hide,
    categoryAdding,
    editCategoryPost,
    checkCategory2
}