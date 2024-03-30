const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const OrderDB = require('../models/orderSchema');

const invoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const email = req.session.user;

    const orderDetails = await OrderDB.findOne({ _id: orderId });

    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const pdfStream = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    pdfStream.pipe(res);

    // Add Border with black color
    pdfStream.lineWidth(2).fillColor('#000000').rect(20, 80, 550, 700).stroke();

    pdfStream.fontSize(18).font('Helvetica-Bold').text('INVOICE DETAILS', 30, 30);
    pdfStream.moveDown(3);


    // Date and Invoice Number
    pdfStream.moveDown();
    pdfStream.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    pdfStream.text(`Invoice Number: ${generateInvoiceNumber()}`);

    pdfStream.moveDown();
    pdfStream.font('Helvetica-Bold').fontSize(14).text('Customer Details');
    pdfStream.moveDown();

    // Customer Details
    pdfStream.moveDown();
    pdfStream.font('Helvetica').fontSize(14).text(`Customer Name: ${orderDetails.userEmail}`);
    const addressParts = orderDetails.address.split(',');
    pdfStream.font('Helvetica').fontSize(12).text(`Address: ${addressParts[0]}`);
    pdfStream.text(`City: ${addressParts[1]}`);
    pdfStream.text(`PhoneNumber: ${addressParts[4]}`);
    pdfStream.text(`Pincode: ${addressParts[3]}`);
    pdfStream.moveDown(2);

    // Order Details (Product Details in Table Format)
    pdfStream.moveDown();
    pdfStream.font('Helvetica-Bold').fontSize(14).text('Order Details');
    pdfStream.moveDown();

    // Table Header
    const tableHeaderY = pdfStream.y + 20;
    pdfStream.font('Helvetica-Bold').fontSize(12).text('Product Name', 30, tableHeaderY, { width: 200, align: 'left' });
    pdfStream.font('Helvetica-Bold').fontSize(12).text('Quantity', 250, tableHeaderY, { width: 50, align: 'center' });
    pdfStream.font('Helvetica-Bold').fontSize(12).text('Price per unit', 320, tableHeaderY, { width: 100, align: 'center' });
    pdfStream.font('Helvetica-Bold').fontSize(12).text('Total', 450, tableHeaderY, { width: 100, align: 'center' });


    // Draw Table Borders
    pdfStream.lineWidth(1).moveTo(20, tableHeaderY).lineTo(570, tableHeaderY).stroke(); // Top border
    pdfStream.moveTo(20, tableHeaderY).lineTo(20, pdfStream.y).stroke(); // Left border
    pdfStream.moveTo(570, tableHeaderY).lineTo(570, pdfStream.y).stroke(); // Right border

    // Table Body
    orderDetails.orderItems.forEach((item, index) => {
      const tableBodyY = tableHeaderY + (index + 1) * 30;
      pdfStream.font('Helvetica').fontSize(12).text(item.productName, 30, tableBodyY, { width: 200, align: 'left' });
      pdfStream.font('Helvetica').fontSize(12).text(item.quantity.toString(), 250, tableBodyY, { width: 50, align: 'center' });
      pdfStream.font('Helvetica').fontSize(12).text(item.price.toString(), 320, tableBodyY, { width: 100, align: 'center' });
      pdfStream.font('Helvetica').fontSize(12).text(item.totalPrice.toString(), 450, tableBodyY, { width: 100, align: 'center' });

      // Draw Row Lines
      pdfStream.moveTo(20, tableBodyY).lineTo(570, tableBodyY).stroke();
    });

    // Draw Line at the Bottom of the Table
    const tableBottomY = pdfStream.y ;
    pdfStream.moveTo(20, tableBottomY).lineTo(570, tableBottomY).stroke();

    // Draw Column Lines
    pdfStream.moveTo(250, tableHeaderY).lineTo(250, pdfStream.y).stroke(); // Column 1
    pdfStream.moveTo(320, tableHeaderY).lineTo(320, pdfStream.y).stroke(); // Column 2
    pdfStream.moveTo(450, tableHeaderY).lineTo(450, pdfStream.y).stroke(); // Column 3

    // Grand Total
    pdfStream.moveDown(3);
    const grandTotalY = pdfStream.y + 10;
    pdfStream.font('Helvetica-Bold').fontSize(14).text(`Grand Total: ${orderDetails.grandTotal}`, 30, grandTotalY);


    // Draw Box around Grand Total
    const boxWidth = 300; // Adjust the box width as needed
    const boxHeight = 35; // Adjust the box height as needed
    pdfStream.lineWidth(1).rect(30, grandTotalY, boxWidth, boxHeight).stroke();



    
    pdfStream.end();
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function generateInvoiceNumber() {
  const prefix = 'INV';
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const invoiceNumber = `${prefix}-${timestamp}-${randomNum}`;
  return invoiceNumber;
}

module.exports = { invoice };