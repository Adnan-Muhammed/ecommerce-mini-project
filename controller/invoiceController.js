

const OrderDB = require("../models/order");


const PDFDocument = require('pdfkit');


const getOrderById = async (orderId) => {
//     let pipeline = [
//         {
//             $match: {
                

//                 "paymentStatus.type": "fulfilled",
//                 // "_id": "orderId"
//             }
//         },
//         {
//             $project: {
//                 "_id": 1,
//                 "userName": 1,
//                 "paymentMethod": 1,
//                 "paymentStatus": 1,
//                 "orderStatus": 1,
//                 "orderDate": 1,
//                 "grandTotal": 1,
//                 "orderItems.productId": 1,
//                 "orderItems.productName": 1,
//                 "orderItems.unitPrice": 1,
//                 "orderItems.quantity": 1,
//                 "orderItems.price": 1,
//                 "orderItems.description": 1,
//                 "orderItems.categoryOffer": 1,
//                 "orderItems.categoryDiscountPecentage": 1,
//                 "orderItems.productOffer": 1,
//                 "orderItems.productDiscountPercentage": 1,
//                 "orderItems.totalPrice": 1,
//                 "tax": 1,
//                 "couponName": 1,
//                 "couponDiscount": 1,
//                 "couponDiscountPercentage": 1,
//                 "shipping": 1,
//                 "billingAddress": 1,
//             }
//         },
//     ];

    

//     const orderAggregate = await OrderDB.aggregate(pipeline);

//     return orderAggregate;



    const order = await OrderDB.findById(orderId).lean().exec();

    if(!order){
        throw new Error('error')
    
    }
    return order;
};









    // const { generateInvoicePDF } = require('./pdfGenerator'); // Import your PDF generation function

const downloadInvoice = async (req, res) => {
    const orderId = req.params.orderId;
    console.log(orderId);
    console.log('opk',77);
    // return


    try{

        
        const orderDetail = await getOrderById(orderId); // Assuming this function retrieves a single order object
        

        console.log(orderDetail);


        // return
        const invoices = await generateInvoicePDF(orderDetail); // Pass the order as an array to generateInvoicePDF
        
    if (invoices.length > 0) {
        // Send the first (and only) invoice to the client for download
        const invoice = invoices[0];
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.send(invoice.pdfBuffer);
    } else {
        res.status(404).send('Invoice not found');
    }
}catch(err){
    res.redirect('/error')
}
    
};


const generateInvoicePDF = async (orderDetail) => {
    const invoices = [];
    
    const doc = new PDFDocument();
    const invoiceId =generateInvoiceNumber()

    const orderDate = new Date(orderDetail.orderDate);
    const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;

    
    // Create PDF invoice in memory
    const pdfBuffer = await new Promise((resolve, reject) => {
        const buffers = [];
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        // Add content to the PDF document
        doc.fontSize(16).text('Invoice', { align: 'center' }).moveDown();

        doc.fontSize(12).text(`Invoice ID: ${invoiceId}`,{align: 'center'})


        doc.fontSize(12).text(`Payment method : ${orderDetail.paymentMethod.type}`,{align: 'center'})
        doc.fontSize(12).text(`Payment method : ${orderDetail.paymentStatus.type}`,{align: 'center'})
        doc.fontSize(12).text(`Date to issue: ${formattedDate}`,{align: 'center'}).moveDown()
        
        // Billing Address
        doc.fontSize(14).text('Billing Address', { underline: true }).moveDown();
        const billingAddress = orderDetail.billingAddress;
        doc.fontSize(12).text(`Name: ${billingAddress.name}`);
        doc.fontSize(12).text(`Phone: ${billingAddress.telephone}`);
        doc.fontSize(12).text(`Address: ${billingAddress.address}`);
        doc.fontSize(12).text(`City: ${billingAddress.city}`);
        doc.fontSize(12).text(`Region/State: ${billingAddress.regionState}`);
        doc.fontSize(12).text(`Postcode: ${billingAddress.postCode}`).moveDown();
        
        doc.fontSize(14).text('Order Items', { underline: true }).moveDown();
        for (const item of orderDetail.orderItems) {
            doc.fontSize(12).text(`Product Name: ${item.productName}`);
            doc.fontSize(12).text(`Quantity: ${item.quantity}`);
            doc.fontSize(12).text(`Unit Price: ${item.unitPrice}`);
            doc.fontSize(12).text(`Total Price: ${item.price}`)
            doc.fontSize(12).text(` Discount: ${item.categoryOffer +item.productOffer}`)
            doc.fontSize(12).text(`Total Price: ${item.totalPrice}`).moveDown();

        }
        if(orderDetail.couponDiscount){
            doc.fontSize(14).text(`Coupon Discount: ${orderDetail.couponDiscount}`)
        }
        doc.fontSize(14).text(`Tax: ${orderDetail.tax}`)
        doc.fontSize(14).text(`Grand Total: ${orderDetail.grandTotal}`).moveDown();

        
        // End PDF generation
        doc.end();
    });
    
    invoices.push({ orderId: orderDetail._id, pdfBuffer });
    
    return invoices;
};


function generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format: YYYYMMDD
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Random 4-digit number
    
    return `${prefix}-${date}-${randomNumber}`;
}



















module.exports = {
    downloadInvoice
};
