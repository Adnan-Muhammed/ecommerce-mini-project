const express = require('express');
const router = express.Router();
const adminSessionMiddleware=require('../middleware/adminSessionHandling.js')

// const session = require('express-session');



const adminController=require('../controller/adminController.js')
router.get('/',adminSessionMiddleware.requireNotAdmin,adminController.adminLogin)


router.post('/admindashboard',   adminController.adminDashboardPost)
router.get('/admindashboard',adminSessionMiddleware.requireAdmin,adminController.adminDashboardGet)
router.get('/logout', adminController.adminLogout);



const userManagement=require('../controller/userManagement.js')
router.get('/userlist',adminSessionMiddleware.requireAdmin, userManagement.userlist);
router.get('/blocked/:id',adminSessionMiddleware.requireAdmin, userManagement.blocking);
router.get('/unblocked/:id',adminSessionMiddleware.requireAdmin, userManagement.unblocking);



const categoryManagement = require('../controller/categoryManagement.js');
router.get('/categoryList', adminSessionMiddleware.requireAdmin, categoryManagement.categorylist);
router.get('/addCategory', adminSessionMiddleware.requireAdmin, categoryManagement.addCategory);
router.post('/categoryAdded', adminSessionMiddleware.requireAdmin, categoryManagement.checkCategory);
router.post('/newCategoryAdded',adminSessionMiddleware.requireAdmin, categoryManagement.categoryAddedPost)
router.get('/show/:id',adminSessionMiddleware.requireAdmin,categoryManagement.show);
router.get('/hide/:id',adminSessionMiddleware.requireAdmin,categoryManagement.hide);



const productManagement = require('../controller/productManagement.js');
router.get('/addproduct',adminSessionMiddleware.requireAdmin, productManagement.addProduct);
router.post('/productadded',adminSessionMiddleware.requireAdmin,productManagement.productadded);//post
router.get('/productlist',adminSessionMiddleware.requireAdmin,productManagement.productListAdmin);
router.get('/unlist/:id',adminSessionMiddleware.requireAdmin,  productManagement.productUnlist)
router.get('/delete/:id',adminSessionMiddleware.requireAdmin,  productManagement.productDelete)
router.get('/list/:id',adminSessionMiddleware.requireAdmin,productManagement.productList)
router.get('/productUpdate/:id',adminSessionMiddleware.requireAdmin,productManagement.productUpdate)
router.get('/delete/:id/uploads/:imgUrl',   adminSessionMiddleware.requireAdmin,productManagement.productImgDelete)

// router.post('/productUpdated/:id',adminSessionMiddleware.requireAdmin,productManagement.productUpdatePost)
router.post('/productUpdated/:id',adminSessionMiddleware.requireAdmin,productManagement.productadded)


// router.get('/order',(req,res)=>{
//     res.render('admin/order')
// })


router.get('/orderlist',(req,res)=>{
    const order={_id:22}
    res.render('admin/orderlist',{order})
})
module.exports = router;
