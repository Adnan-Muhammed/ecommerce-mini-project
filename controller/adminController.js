require('dotenv').config();
const adminId=process.env.ADMIN_ID
const adminPassword=process.env.PASSWORD

const pdf = require('pdfkit');
const OrderDB =require('../models/order');
const { orderStatus } = require('./orderManagement');



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




const adminDashboardGet = async (req, res) => {
    try {
        // Fetching only 5 orders for admin dashboard
        const orders = await generateSalesReport(3); // Limiting to 5 orders for admin dashboard
        console.log(orders.length);
        console.log(orders);
        // res.json(orders)

        const overallOrder = await OrderDB.aggregate([
            {
              $match: {
                "paymentStatus.type": "fulfilled"
              }
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: "$grandTotal" }
              }
            }
          ])


          const couponDeduction = await OrderDB.aggregate([
            {
              $match: {
                "paymentStatus.type": "fulfilled"
              }
            },
            {
              $group: {
                _id: null,
                couponDiscount: { $sum: "$couponDiscount" }
              }
            }
          ])



        const overallDiscount = await OrderDB.aggregate([
            {
              $match: {
                "paymentStatus.type": "fulfilled"
              }
            },
            {
              $unwind: "$orderItems"
            },
            {
              $group: {
                _id: null,
                totalDiscount: {
                  $sum: {
                    $add: ["$orderItems.productOffer", "$orderItems.categoryOffer"]
                  }
                }
              }
            }
          ])


        
          

       
       

        // Assuming `result` contains the aggregation result
        const totalDiscount = overallDiscount[0].totalDiscount;
        console.log("Total Discount:", totalDiscount);
        const totalOrder = overallOrder[0].totalOrders;
        const totalAmount = overallOrder[0].totalAmount
        const couponDiscount = couponDeduction[0].couponDiscount


          
        // return


        // const overallSalesCount = find()
        res.render('admin/admin-dashboard', { orders,totalDiscount,totalOrder,totalAmount,couponDiscount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const salesReport = async (req, res) => {
    try {
        const orders = await generateSalesReport(); // Fetching all orders for sales report
        res.render('admin/salesReport', { orders });


        // res.json(orders)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const generateSalesReport = async (limit) => {
    let pipeline = [
        {
            $match: {
                "paymentStatus.type": "fulfilled"
            }
        },
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
        },
        {
            $sort: { "orderDate": -1 } // Sort by orderDate in descending order
        }
    ];

    // Applying limit only if provided and if it's not equal to 0
    if (limit && limit !== 0) {
        pipeline.push({ $limit: limit });
    }

    const salesAggregate = await OrderDB.aggregate(pipeline);

    return salesAggregate;
};



// const jsPDF = require('jspdf');
// const htmlToPDF = require('html-pdf');

downloadPDF = async (req, res, next) => {
  // Code to fetch data for the table (if needed)

  // HTML content of the table
  const salesHTML = `
      <table id="salesTable" class="table table-bordered">
          <!-- Table content goes here -->
      </table>
  `;

  // Create a new jsPDF instance
  const pdf = new jsPDF();

  // Add the HTML content to the PDF document
  pdf.html(salesHTML, {
      callback: function (pdf) {
          // Send the PDF as a response
          res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="sales_report.pdf"'
          });
          res.send(pdf.output());
      }
  });
};


module.exports={
    adminLogin,
    adminDashboardPost,
    adminDashboardGet,
    adminLogout,
    pdfDownloading,
    salesReport,
}