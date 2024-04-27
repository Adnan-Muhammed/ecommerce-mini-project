

const OrderDB = require("../models/order");


const PDFDocument = require('pdfkit');












const downloadInvoice = async (req, res) => {
    const orderId = req.params.orderId;
 


    try{

        
        const orderDetail = await getOrderById(orderId); // Assuming this function retrieves a single order object
        



        // return
        const doc = await generateInvoicePDF(orderDetail); // Pass the order as an array to generateInvoicePDF
        
    if (true) {
        // Send the first (and only) invoice to the client for download
        // const invoice = invoices[0];
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename=invoice_${orderId}.pdf`);
        doc.pipe(res)
        doc.end()
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
        // doc.on('data', buffer => buffers.push(buffer));
        // doc.on('end', () => resolve(Buffer.concat(buffers)));
        
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
        // doc.end();
    });
    
    // invoices.push({ orderId: orderDetail._id, pdfBuffer });
    
    // return invoices;
    return doc;
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
