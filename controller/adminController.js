require('dotenv').config();
const adminId=process.env.ADMIN_ID
const adminPassword=process.env.PASSWORD

const pdf = require('pdfkit');
const OrderDB =require('../models/order')



const adminLogin=(req,res)=>{
    res.render('admin/sign-in')
}

const adminDashboardPost=(req,res)=>{
    const {admin_id,password}=req.body
     if(admin_id==adminId &&  password==adminPassword){
        req.session.admin=adminId
        res.redirect('/admin/admindashboard')
    }
    else{
        res.redirect('/admin')
    }
}

const adminDashboardGet=async(req,res)=>{
    try{
const orderList =await OrderDB.find()
        const deliveredOrders = orderList.filter(order => order.orderStatus.type === "delivered");

        req.session.deliveredOrders=deliveredOrders
        res.render('admin/admin-dashboard',{deliveredOrders})
        
    }catch(err){

    }
}

const adminLogout=(req, res)=>{
    req.session.admin = null;
    res.redirect('/admin');
}




const pdfDownloading = (req, res) => {
    // Create a new PDF document
    const doc = new PDFDocument();
   const deliveredOrders=  req.session.deliveredOrders
    // Set response headers for PDF download
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    // Pipe the PDF document to the response
    doc.pipe(res);
    // Add content to the PDF document
    doc.fontSize(14).text('Recent Sales Report', { align: 'center' }).moveDown();
    deliveredOrders.forEach(order => {
        doc.text(`Date: ${order.orderDate.toLocaleDateString()}`);
        doc.text(`Invoice: ${order._id}`);
        doc.text(`Customer: ${order.userEmailId}`);
        doc.text(`Amount: $${order.grandTotal}`);
        doc.text(`Status: ${order.orderStatus.type}`);
        doc.moveDown();
    });
    // Finalize the PDF document
    doc.end();
};



const salesReport=  async (req, res) => {
    try {
      const orders = await generateSalesReport();
      console.log(orders.length);
    //   obj={name:"Adnan",payment:"fulfilled",products:[{productName:"A",price:30},{productName:"B",price:20}]} 
    //   res.render('admin/salesReport',{obj})
    //   res.json(orders);
    res.render('admin/salesReport',{orders})
    // res.render('admin/salesReport2',{orders})
} catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };





async function generateSalesReport() {
    // const salesAggregate = await OrderDB.aggregate([
    //     { $unwind: "$orderItems" }, // Unwind the orderItems array
    //     {
    //         $project: {
    //             _id: "$orderItems._id",
    //             userName: 1,
    //             "orderItems.productId": 1,
    //             "orderItems.productName": 1,
    //             "orderItems.unitPrice": 1,
    //             "orderItems.quantity": 1,
    //             "orderItems.price": 1,
    //             "orderItems.description": 1,
    //             "orderItems.categoryOffer": 1,
    //             "orderItems.categoryDiscountPecentage": 1,
    //             "orderItems.productOffer": 1,
    //             "orderItems.productDiscountPercentage": 1,
    //             "orderItems.totalPrice": 1,
    //             tax: 1,
    //             couponId: 1,
    //             couponName: 1,
    //             couponDiscount: 1,
    //             couponDiscountPercentage: 1,
    //             grandTotal: 1,
    //             paymentMethod: 1,
    //             paymentStatus: 1,
    //             orderStatus: 1,
    //             orderDate: 1
    //         }
    //     },
    //     {
    //         $match: {
    //             $or: [
    //                 { "paymentStatus.type": "fulfilled" },
    //                 { "orderStatus.type": "delivered" }
    //             ]
    //         }
    //     }
    // ]);
    
    
    // const salesAggregate = await OrderDB.aggregate([
    //     {
    //       $project: {
    //         userId: 1,
    //         userName: 1,
    //         orderItems: 1,
    //         paymentMethod: 1,
    //         paymentStatus: 1,
    //         orderStatus: 1,
    //         orderDate: 1,
    //         grandTotal: 1,
    //         tax: 1,
    //         couponName: 1,
    //         couponDiscount: 1,
    //         couponDiscountPercentage: 1
    //       }
    //     }
    //   ])

    // const salesAggregate = await OrderDB.aggregate([
    //     {
    //       $project: {
    //         userName: 1,
    //         orderItems: {
    //           $map: {
    //             input: "$orderItems",
    //             as: "item",
    //             in: {
    //               productName: "$$item.productName",
    //               unitPrice: "$$item.unitPrice",
    //               quantity: "$$item.quantity",
    //               price: "$$item.price",
    //               categoryOffer: "$$item.categoryOffer",
    //               categoryDiscountPecentage: "$$item.categoryDiscountPecentage",
    //               productOffer: "$$item.productOffer",
    //               productDiscountPercentage: "$$item.productDiscountPercentage",
    //               totalPrice: "$$item.totalPrice"
    //             }
    //           }
    //         },
    //         tax: 1,
    //         couponDiscount: 1,
    //         couponDiscountPercentage: 1,
    //         grandTotal: 1,
    //         paymentMethod: 1,
    //         paymentStatus: 1,
    //         orderStatus: 1,
    //         orderDate: 1
    //       }
    //     }
    //   ])
      
    // const salesAggregate = await OrderDB.find({},{billingAddress:0,_id:0,createdAt,updatedAt,couponId,shipping,tax,images,productId,userId})

    // const salesAggregate = await OrderDB.find()
    // const salesAggregate = await OrderDB.aggregate([
    //     {
    //         $project: {
    //             "_id": 1,
    //             "userName": 1,
    //             "billingAddress": 1,
    //             "paymentMethod": 1,
    //             "paymentStatus": 1,
    //             "orderStatus": 1,
    //             "orderDate": 1,
    //             "grandTotal": 1,
    //             "orderItems": 1,
    //             "tax": 1,
    //             "couponName": 1,
    //             "couponDiscount": 1,
    //             "couponDiscountPercentage": 1,
    //             "shipping": 1
    //         }
    //     }
    // ]);

    const salesAggregate = await OrderDB.aggregate([
        {
            $project: {
                "_id": 1,
                "userName": 1,
                "paymentMethod": 1,
                "paymentStatus": 1,
                "orderStatus": 1,
                "orderDate": 1,
                "grandTotal": 1,
                "orderItems.productId": 1,
                "orderItems.productName": 1,
                "orderItems.unitPrice": 1,
                "orderItems.quantity": 1,
                "orderItems.price": 1,
                "orderItems.description": 1,
                "orderItems.categoryOffer": 1,
                "orderItems.categoryDiscountPecentage": 1,
                "orderItems.productOffer": 1,
                "orderItems.productDiscountPercentage": 1,
                "orderItems.totalPrice": 1,
                "tax": 1,
                "couponName": 1,
                "couponDiscount": 1,
                "couponDiscountPercentage": 1,
                "shipping": 1
            }
        }
    ]);
    
    

    return salesAggregate;
  }





module.exports={
    adminLogin,
    adminDashboardPost,
    adminDashboardGet,
    adminLogout,
    pdfDownloading,
    salesReport,
}