const express = require('express');
const router = express.Router();
const adminSessionMiddleware=require('../middleware/adminSessionHandling.js')




const adminController=require('../controller/adminController.js')
router.get('/',adminSessionMiddleware.requireNotAdmin,adminController.adminLogin)


router.post('/admindashboard',   adminController.adminDashboardPost)
router.get('/admindashboard',adminSessionMiddleware.requireAdmin,adminController.adminDashboardGet)
router.get('/logout', adminController.adminLogout);

router.post('/admin/download-pdf',adminSessionMiddleware.requireAdmin,   adminController.pdfDownloading)

router.get('/salesReport',adminSessionMiddleware.requireAdmin,   adminController.salesReport)


const userManagement=require('../controller/userManagement.js')
router.get('/userlist',adminSessionMiddleware.requireAdmin, userManagement.userlist);
router.get('/blocked/:id',adminSessionMiddleware.requireAdmin, userManagement.blocking);
router.get('/unblocked/:id',adminSessionMiddleware.requireAdmin, userManagement.unblocking);



const categoryManagement = require('../controller/categoryManagement.js');
router.get('/categoryList', adminSessionMiddleware.requireAdmin, categoryManagement.categorylist);
router.get('/addCategory', adminSessionMiddleware.requireAdmin, categoryManagement.addCategory);




router.post('/categoryAdded', adminSessionMiddleware.requireAdmin, categoryManagement.categoryAdding);







router.post('/categoryAdded2', adminSessionMiddleware.requireAdmin, categoryManagement.checkCategory2);

router.post('/newCategoryAdded',adminSessionMiddleware.requireAdmin, categoryManagement.categoryAddedPost)  
router.get('/show/:id',adminSessionMiddleware.requireAdmin,categoryManagement.show);
router.get('/hide/:id',adminSessionMiddleware.requireAdmin,categoryManagement.hide);


router.get('/editCategory/:id', adminSessionMiddleware.requireAdmin, categoryManagement.editCategory);
router.put('/categoryEdited/:id',   adminSessionMiddleware.requireAdmin, categoryManagement.editCategoryPost);





const couponManagement = require('../controller/couponController.js')
router.get('/couponList', adminSessionMiddleware.requireAdmin, couponManagement.couponlist);
router.get('/addCoupon', adminSessionMiddleware.requireAdmin, couponManagement.addCoupon);
router.post('/newCoupon', adminSessionMiddleware.requireAdmin, couponManagement.couponAdding);

router.get('/editCoupon/:id',  adminSessionMiddleware.requireAdmin, couponManagement.editCoupon);
router.post('/editCouponPost/:id',  adminSessionMiddleware.requireAdmin, couponManagement.editCouponPost);

router.delete('/deleteCoupon', adminSessionMiddleware.requireAdmin, couponManagement.deleteCoupon);
router.get('/unlist/coupon/:couponId',adminSessionMiddleware.requireAdmin,couponManagement.hide);
router.get('/list/coupon/:couponId',adminSessionMiddleware.requireAdmin,couponManagement.show);







const productManagement = require('../controller/productManagement.js');
router.get('/unlist/product/:id',adminSessionMiddleware.requireAdmin,  productManagement.productUnlist)
router.get('/list/product/:id',adminSessionMiddleware.requireAdmin,productManagement.productList)
router.get('/delete/product/:id',adminSessionMiddleware.requireAdmin,  productManagement.productDelete)

router.get('/addproduct',adminSessionMiddleware.requireAdmin, productManagement.addProduct);
router.post('/productadded', adminSessionMiddleware.requireAdmin,productManagement.productadded);
router.post('/productupdated/:id',adminSessionMiddleware.requireAdmin,productManagement.productadded)

router.get('/productlist',adminSessionMiddleware.requireAdmin,productManagement.productListAdmin);
router.get('/productUpdate/:id',adminSessionMiddleware.requireAdmin,productManagement.productUpdate)
router.delete('/delete/:id/uploads/:imgUrl',  adminSessionMiddleware.requireAdmin,productManagement.productImgDelete)







router.post('/dateFilter',adminSessionMiddleware.requireAdmin,adminController.dateFilter)
router.post('/yearFilter',adminSessionMiddleware.requireAdmin,adminController.yearFilter)
router.post('/monthFilter',adminSessionMiddleware.requireAdmin,adminController.monthFilter)








const orderManagement = require('../controller/orderManagement.js')
router.get('/orderlist',adminSessionMiddleware.requireAdmin,orderManagement.orderUpdates)







router.get('/top5Products/:month',  adminController.top5ProductsMonth)
router.get('/top5Products/year/:year', adminController.top5ProductsYear )

router.get('/top5Categories/:month',  adminController.top5CategoriesMonth)
router.get('/top5Categories/year/:year', adminController.top5CategoriesYear )










module.exports = router;
