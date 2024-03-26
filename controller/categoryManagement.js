const session = require('express-session');
const CategoryDB = require('../models/category');






const categorylist=async (req,res)=>{
    try{
        const categoryList=await CategoryDB.find()
        if(categoryList.length>0){
            console.log(categoryList);
            console.log('listed');
            res.render('admin/categorylist',{categoryList})
        }else{
            console.log('NO DATA');
            res.render('admin/categorylist')
            }
        }catch (err){
            console.error(err);
        }
}







const addCategory=(req,res)=>{
    res.render('admin/addCategory')
}


const editCategory=  async (req,res)=>{
    try{
        const categoryId=req.params.id
        console.log(categoryId);
        // const category = await CategoryDB.find({_id:categoryId},{name:1,_id:0})
        const category = await CategoryDB.findById(categoryId)
        console.log('----==-=-====-=--=');
       console.log(category);
res.render('admin/editCategory',{category})
    } catch (err){
        console.error(err);
    }
}



const categoryAddedPost= async (req,res)=>{
    try{
        const categoryData={
            name:req.body.categoryName.trim().toUpperCase()
        }
        await CategoryDB.insertMany([categoryData]);
        console.log(categoryData,"categoryData2");
            res.redirect('/admin/categoryList')
    }catch (err){
        console.error(err);
    }
}



const categoryAdding = async (req, res) => {
    try {
        const categoryName = req.body.categoryName.trim().toUpperCase();

        const existingCategory = await CategoryDB.findOne({ name: categoryName });

        if (existingCategory) {
            res.json({ exists: "this category name is existing add another one " }); // Category exists
            console.log("existing");
        } else {
            const filteredData = Object.entries(req.body).reduce((acc, [key, value]) => {
                if (value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});
            // const filteredData2 = Object.fromEntries(
            //     Object.entries(req.body)
            //     .filter(([key, value]) => value !== '')
            // );
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
                console.log("not existing");
            }
            }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};









const checkCategory2 = async (req, res) => {
    try {
        console.log('hgfhdgcfc');
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




// const editCategoryPost = async (req, res) => {
//     try {
//         let startDate, endDate;

//         if (req.body.startDate && req.body.endDate) {
//             const startDateParts = req.body.startDate.split('/');
//             startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);

//             const endDateParts = req.body.endDate.split('/');
//             endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);
//         }

//         console.log('Parsed start date:', startDate);
//         console.log('Parsed end date:', endDate);

//         const categoryName = req.body.categoryName.trim().toUpperCase();
//         const existingCategories = await CategoryDB.find({ name: categoryName });
        
//         if (existingCategories.length > 0) {
//             for (let i = 0; i < existingCategories.length; i++) {
//                 const existingCategory = existingCategories[i];
//                 const existingId = existingCategory._id.toString();
    
//                 if (existingId !== req.body.categoryId) {
//                     console.log('-=-=-=-=-=-', 123);
//                     console.log(existingId);
//                     console.log(req.body.categoryId);
//                     console.log('-=-=-=-=-=-', 456);

//                     console.log(12345);
//                     res.json({ exists: "this category name is existing add another one " }); // Category exists
//                     return;
//                 } else {
//                     console.log('same ID');
//                     existingCategory.name = req.body.categoryName;
//                     existingCategory.discountPercentage = req.body.discountPercentage;
//                     existingCategory.startDate = startDate;
//                     existingCategory.endDate = endDate;
    
//                     try {
//                         await existingCategory.save();
//                     } catch (error) {
//                         console.error("Error saving category:", error);
//                         res.status(500).json({ error: "An error occurred while saving the category." });
//                         return;
//                     }
//                 }
//             }
//             res.json({ success: "Category updated successfully." });
//         } else {
//             const updateCategory = await CategoryDB.findById(req.body.categoryId);

//             if (updateCategory) {
//                 updateCategory.name = req.body.categoryName;
//                 updateCategory.discountPercentage = req.body.discountPercentage;
//                 updateCategory.startDate = startDate;
//                 updateCategory.endDate = endDate;

//                 try {
//                     await updateCategory.save();
//                     res.json({ success: "Category updated successfully." });
//                 } catch (error) {
//                     console.error("Error saving category:", error);
//                     res.status(500).json({ error: "An error occurred while saving the category." });
//                 }
//             } else {
//                 res.status(404).json({ error: "Category not found." });
//             }
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// const editCategoryPost = async (req, res) => {
//     try {
//         const startDate = req.body.startDate ? new Date(req.body.startDate.split('/').reverse().join('-')) : undefined;
//         const endDate = req.body.endDate ? new Date(req.body.endDate.split('/').reverse().join('-')) : undefined;

//         const categoryName = req.body.categoryName.trim().toUpperCase();
//         const existingCategories = await CategoryDB.find({ name: categoryName });
        
//         if (existingCategories.some(category => category._id.toString() !== req.body.categoryId)) {
//             res.json({ exists: "This category name is existing, please add another one." });
//             return;
//         }
//         const updateCategory = await CategoryDB.findById(req.body.categoryId);
//         if (!updateCategory) {
//             res.status(404).json({ error: "Category not found." });
//             return;
//         }
//         if (startDate !== undefined) {
//             updateCategory.startDate = startDate;
//         }
//         if (endDate !== undefined) {
//             updateCategory.endDate = endDate;
//         }
//         updateCategory.name = req.body.categoryName;
//         updateCategory.discountPercentage = req.body.discountPercentage;

//         await updateCategory.save();
//         res.json({ success: "Category updated successfully." });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };
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
    console.log('middleware1');
        try{
            const categoryIdToUpdate=req.params.id
            await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: false } });
    res.redirect('/admin/categoryList')
        } catch (err){
            console.error(err);
        }

}


const show=  async (req,res)=>{
        try{
            const categoryIdToUpdate=req.params.id
            await CategoryDB.find({_id:categoryIdToUpdate},{name:1,_id:0})
            await CategoryDB.updateOne({ _id: categoryIdToUpdate }, { $set: { isAvailable: true } });
    res.redirect('/admin/categoryList')
        } catch (err){
            console.error(err);
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