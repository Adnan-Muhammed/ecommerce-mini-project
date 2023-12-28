


const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController/adminlogin.js');
const categoryManagement = require('../controller/adminController/categorymanagement.js');
const productManagement = require('../controller/adminController/productmanagement.js');
const userManagement = require('../controller/adminController/usermanagement.js');
const session = require('express-session');



// Define routes
router.get('/', adminController.adminlogin);
router.post('/admindashboard', adminController.admindashboardPost);
router.get('/admindashboard', adminController.admindashboardGet);
router.get('/logout', adminController.adminlogout);

router.get('/userlist', userManagement.userlist);
router.get('/blocked/:id', userManagement.blocking);
router.get('/unblocked/:id', userManagement.unblocking);



router.get('/categoryList', categoryManagement.categorylist);
router.get('/addCategory', categoryManagement.addCategory);
router.post('/categoryAdded', categoryManagement.categoryAddedPost);
router.get('/show/:id',  categoryManagement.show);
router.get('/hide/:id', categoryManagement.hide);




router.get('/addproduct', productManagement.addProduct);
router.post('/productadded', productManagement.productadded);//post
router.get('/productlist', productManagement.productlist);


// router.get('/')
module.exports = router;
