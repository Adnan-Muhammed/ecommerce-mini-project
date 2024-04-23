require("dotenv").config();
const adminId = process.env.ADMIN_ID;
const adminPassword = process.env.PASSWORD;

const pdf = require("pdfkit");
const OrderDB = require("../models/order");
const { orderStatus } = require("./orderManagement");
const { log } = require("console");

const adminLogin = (req, res) => {
  res.render("admin/sign-in");
};

const adminDashboardPost = (req, res) => {
  const { admin_id, password } = req.body;
  if (admin_id == adminId && password == adminPassword) {
    req.session.admin = adminId;
    res.redirect("/admin/admindashboard");
  } else {
    res.redirect("/admin");
  }
};

const adminLogout = (req, res) => {
  req.session.admin = null;
  res.redirect("/admin");
};

const pdfDownloading = (req, res) => {
  // Create a new PDF document
  const doc = new PDFDocument();
  const deliveredOrders = req.session.deliveredOrders;
  // Set response headers for PDF download
  res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
  res.setHeader("Content-Type", "application/pdf");
  // Pipe the PDF document to the response
  doc.pipe(res);
  // Add content to the PDF document
  doc.fontSize(14).text("Recent Sales Report", { align: "center" }).moveDown();
  deliveredOrders.forEach((order) => {
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

const salesReport = async (req, res) => {
  try {
    const orders = await generateSalesReport(); // Fetching all orders for sales report
    res.render("admin/sales-report", { orders });

    // res.json(orders)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const generateSalesReport = async (limit) => {
  let pipeline = [
    {
      $match: {
        "paymentStatus.type": "fulfilled",
      },
    },
    {
      $project: {
        _id: 1,
        userName: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        orderStatus: 1,
        orderDate: 1,
        grandTotal: 1,
        "orderItems.productId": 1,
        "orderItems.productName": 1,
        "orderItems.unitPrice": 1,
        "orderItems.quantity": 1,
        "orderItems.price": 1,
        "orderItems.description": 1,
        "orderItems.categoryId": 1,
        "orderItems.categoryName": 1,
        "orderItems.categoryOffer": 1,
        "orderItems.categoryDiscountPecentage": 1,
        "orderItems.productOffer": 1,
        "orderItems.productDiscountPercentage": 1,
        "orderItems.totalPrice": 1,
        tax: 1,
        couponName: 1,
        couponDiscount: 1,
        couponDiscountPercentage: 1,
        shipping: 1,
      },
    },
    {
      $sort: { orderDate: -1 }, // Sort by orderDate in descending order
    },
  ];

  // Applying limit only if provided and if it's not equal to 0
  if (limit && limit !== 0) {
    pipeline.push({ $limit: limit });
  }

  const salesAggregate = await OrderDB.aggregate(pipeline);

  return salesAggregate;
};

const adminDashboardGetOrgin = async (req, res) => {
  try {
    // Fetching only 5 orders for admin dashboard
    const orders = await generateSalesReport(3); // Limiting to 5 orders for admin dashboard
    console.log(orders.length);
   
    const overallOrder = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
        },
      },
    ]);

    const couponDeduction = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $group: {
          _id: null,
          couponDiscount: { $sum: "$couponDiscount" },
        },
      },
    ]);

    const overallDiscount = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: null,
          totalDiscount: {
            $sum: {
              $add: ["$orderItems.productOffer", "$orderItems.categoryOffer"],
            },
          },
        },
      },
    ]);

    // Assuming `result` contains the aggregation result
    const totalDiscount = overallDiscount[0].totalDiscount;
    console.log("Total Discount:", totalDiscount);
    const totalOrder = overallOrder[0].totalOrders;
    const totalAmount = overallOrder[0].totalAmount;
    const couponDiscount = couponDeduction[0].couponDiscount;


    let currentYear = new Date().getFullYear(); // Get current year
    let pipelineYear = [
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $project: {
          year: { $year: "$orderDate" }, // Extract year from orderDate
          grandTotal: 1,
        },
      },
      {
        $match: {
          year: { $gte: 2019, $lte: currentYear }, // Filter years from 2019 to currentYear
        },
      },
      {
        $group: {
          _id: "$year",
          totalSales: { $sum: "$grandTotal" }, // Calculate total sales for each year
        },
      },
      {
        $project: {
          _id: 1,
          totalSales: { $floor: "$totalSales" }, // Truncate totalSales to integer
          // Alternatively, you can use $trunc: "$totalSales" to truncate without rounding
        },
      },
      {
        $sort: { _id: 1 }, // Sort by year in ascending order
      },
    ];

    const totalSalesEachYears = await OrderDB.aggregate([pipelineYear]);

    const salesByYear = {};
    totalSalesEachYears.forEach(
      (item) => (salesByYear[item._id] = item.totalSales)
    );

    // Generate an array of years from 2019 to 2024
    const years = Array.from(
      { length: 2024 - 2019 + 1 },
      (_, index) => 2019 + index
    );

    // Fill in sales data for each year, setting totalSales to 0 if no sales data exists
    const yearlyTotalSale = years.map((year) => ({
      _id: year,
      totalSales: salesByYear[year] || 0,
    }));




    const pipelineMonth = [
      // Match orders with payment status fulfilled and from the current year
      {
        $match: {
          "paymentStatus.type": "fulfilled",
          orderDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      // Project month from orderDate
      {
        $project: {
          month: { $month: "$orderDate" },
          grandTotal: 1,
        },
      },
      // Group by month, calculate total sales
      {
        $group: {
          _id: "$month",
          totalSales: { $sum: "$grandTotal" },
        },
      },
      // Project to floor the total sales
      {
        $project: {
          _id: 1,
          totalSales: { $floor: "$totalSales" },
        },
      },
      // Sort by month in ascending order
      { $sort: { _id: 1 } },
    ];

    const totalSalesEachMonth = await OrderDB.aggregate(pipelineMonth);

    const salesByMonth = {};
    totalSalesEachMonth.forEach(
      (item) => (salesByMonth[item._id] = item.totalSales)
    );

    const monthLength = 12;

    // Generate an array of months from 1 to the current month
    const months = Array.from({ length: monthLength }, (_, index) => index + 1);

    // Fill in sales data for each month, setting totalSales to 0 if no sales data exists
    const monthlyTotalSale = months.map((month) => ({
      _id: month,
      totalSales: salesByMonth[month] || 0,
    }));

    let findTop5Categories = [
      // Match orders with paymentStatus.type "fulfilled"
      { $match: { "paymentStatus.type": "fulfilled" } },
      // Unwind the orderItems array
      { $unwind: "$orderItems" },
      // Group by categoryId and productId, summing up the quantity for each product
      {
        $group: {
          _id: {
            categoryId: "$orderItems.categoryId",
            productId: "$orderItems.productId",
          },
          totalQuantity: { $sum: "$orderItems.quantity" },
        },
      },
      // Group by categoryId to calculate the total count
      {
        $group: {
          _id: "$_id.categoryId",
          totalCount: { $sum: "$totalQuantity" },
        },
      },
      // Lookup to fetch category data
      {
        $lookup: {
          from: "categorycollections",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      // Unwind the category array
      { $unwind: "$category" },
      // Project to include category name and total count
      {
        $project: {
          categoryName: "$category.name",
          totalCount: 1,
        },
      },
      // Sort categories by totalCount in descending order
      { $sort: { totalCount: -1 } },
      // Limit the result to the top 5 categories
      { $limit: 5 },
    ];

    const top5Categories = await OrderDB.aggregate(findTop5Categories);


    let findTop5Products = [
      // Match orders with paymentStatus.type "fulfilled"
      { $match: { "paymentStatus.type": "fulfilled" } },
      // Unwind the orderItems array
      { $unwind: "$orderItems" },
      // Group by productId, summing up the quantity for each product
      {
        $group: {
          _id: "$orderItems.productId",
          totalQuantity: { $sum: "$orderItems.quantity" },
        },
      },
      // Sort products by totalQuantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit the result to the top 5 products
      { $limit: 5 },
      // Lookup to fetch product data
      {
        $lookup: {
          from: "productdbs",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      // Unwind the product array
      { $unwind: "$product" },
      // Project to include product name and total count
      {
        $project: {
          productName: "$product.name",
          totalCount: "$totalQuantity",
        },
      },
    ];

    const top5Products = await OrderDB.aggregate(findTop5Products);


    res.render("admin/admin-dashboard", {
      orders,
      totalDiscount,
      totalOrder,
      totalAmount,
      couponDiscount,
      monthlyTotalSale,
      yearlyTotalSale,
      top5Categories,
      top5Products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};







const adminDashboardGet = async (req, res) => {
  try {
    // Fetching only 5 orders for admin dashboard
    const orders = await generateSalesReport(3); // Limiting to 5 orders for admin dashboard

    const overallOrder = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
        },
      },
    ]);

    const couponDeduction = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $group: {
          _id: null,
          couponDiscount: { $sum: "$couponDiscount" },
        },
      },
    ]);

    const overallDiscount = await OrderDB.aggregate([
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: null,
          totalDiscount: {
            $sum: {
              $add: ["$orderItems.productOffer", "$orderItems.categoryOffer"],
            },
          },
        },
      },
    ]);

    // Assuming `result` contains the aggregation result

    
    const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
    const totalOrder = overallOrder.length > 0 ? overallOrder[0].totalOrders : 0;
    const totalAmount = overallOrder.length > 0 ? overallOrder[0].totalAmount : 0;
    const couponDiscount = couponDeduction.length > 0 ? couponDeduction[0].couponDiscount : 0;





    // yearly total sales
    const currentYear = new Date().getFullYear(); // Get current year
    const currentMonth = new Date().getMonth() + 1; // Month is zero-based, so adding 1 to get current month

    let pipelineYear = [  
      {
        $match: {
          "paymentStatus.type": "fulfilled",
        },
      },
      {
        $project: {
          year: { $year: "$orderDate" }, // Extract year from orderDate
          grandTotal: 1,
        },
      },
      {
        $match: {
          year: { $gte: 2019, $lte: currentYear }, // Filter years from 2019 to currentYear
        },
      },
      {
        $group: {
          _id: "$year",
          totalSales: { $sum: "$grandTotal" }, // Calculate total sales for each year
        },
      },
      {
        $project: {
          _id: 1,
          totalSales: { $floor: "$totalSales" }, // Truncate totalSales to integer
          // Alternatively, you can use $trunc: "$totalSales" to truncate without rounding
        },
      },
      {
        $sort: { _id: 1 }, // Sort by year in ascending order
      },
    ];

    const totalSalesEachYears = await OrderDB.aggregate([pipelineYear]);

    const salesByYear = {};
    totalSalesEachYears.forEach(
      (item) => (salesByYear[item._id] = item.totalSales)
    );

    // Generate an array of years from 2019 to 2024
    const years = Array.from(
      { length: 2024 - 2019 + 1 },
      (_, index) => 2019 + index
    );

    // Fill in sales data for each year, setting totalSales to 0 if no sales data exists
    const yearlyTotalSale = years.map((year) => ({
      _id: year,
      totalSales: salesByYear[year] || 0,
    }));

    // monthly total sales
    const pipelineMonth = [
      // Match orders with payment status fulfilled and from the current year
      {
        $match: {
          "paymentStatus.type": "fulfilled",
          orderDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      // Project month from orderDate
      {
        $project: {
          month: { $month: "$orderDate" },
          grandTotal: 1,
        },
      },
      // Group by month, calculate total sales
      {
        $group: {
          _id: "$month",
          totalSales: { $sum: "$grandTotal" },
        },
      },
      // Project to floor the total sales
      {
        $project: {
          _id: 1,
          totalSales: { $floor: "$totalSales" },
        },
      },
      // Sort by month in ascending order
      { $sort: { _id: 1 } },
    ];

    const totalSalesEachMonth = await OrderDB.aggregate(pipelineMonth);

    const salesByMonth = {};
    totalSalesEachMonth.forEach(
      (item) => (salesByMonth[item._id] = item.totalSales)
    );

    const monthLength = 12;

    const months = Array.from({ length: monthLength }, (_, index) => index + 1);

    // Fill in sales data for each month, setting totalSales to 0 if no sales data exists
    const monthlyTotalSale = months.map((month) => ({
      _id: month,
      totalSales: salesByMonth[month] || 0,
    }));






   





    const findMonthlyTop5Categories = [
      // Match orders within the current month
      {
          $match: {
              $expr: {
                  $and: [
                      { $eq: [{ $year: "$orderDate" }, new Date().getFullYear()] }, // Filter by current year
                      { $eq: [{ $month: "$orderDate" }, currentMonth] } // Filter by current month
                  ]
              },
              "paymentStatus.type": "fulfilled" // Include only fulfilled orders
          }
      },
      // Unwind order items array
      { $unwind: "$orderItems" },
      // Group by category ID and calculate total quantity sold
      {
          $group: {
              _id: "$orderItems.categoryId",
              categoryName: { $first: "$orderItems.categoryName" },
              totalQuantity: { $sum: "$orderItems.quantity" }
          }
      },
      // Exclude _id field from the result
      { $project: { _id: 0, categoryName: 1, totalQuantity: 1 } },
      // Sort by total quantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit to the top 5 categories
      { $limit: 5 }
  ];
    const currentMonthTop5Categories = await OrderDB.aggregate(findMonthlyTop5Categories);



    const findMonthlyTop5Products =  [
      // Match orders within the current month
      {
          $match: {
              $expr: {
                  $and: [
                      { $eq: [{ $year: "$orderDate" }, new Date().getFullYear()] }, // Filter by current year
                      { $eq: [{ $month: "$orderDate" }, currentMonth] } // Filter by current month
                  ]
              },
              "paymentStatus.type": "fulfilled" // Include only fulfilled orders
          }
      },
      // Unwind order items array
      { $unwind: "$orderItems" },
      // Group by product ID and calculate total quantity sold
      {
          $group: {
              _id: "$orderItems.productId",
              productName: { $first: "$orderItems.productName" },
              totalQuantity: { $sum: "$orderItems.quantity" }
          }
      },
      // Exclude _id field from the result
      { $project: { _id: 0, productName: 1, totalQuantity: 1 } },
      // Sort by total quantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit to the top 5 products
      { $limit: 5 }
  ];
    const currentMonthTop5Products = await OrderDB.aggregate(findMonthlyTop5Products);

    
    









    res.render("admin/admin-dashboard", {
      orders,
      totalDiscount,
      totalOrder,
      totalAmount,
      couponDiscount,
      monthlyTotalSale,
      yearlyTotalSale,
      currentMonthTop5Categories,
      // yearlyTop5Categories,
      currentMonthTop5Products,
      // yearlyTop5Products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};











const dateFilter = async (req, res) => {
  const { startDate, endDate } = req.body;


  const startDateObj = new Date(startDate);

  // Format the date portion separately
  const startYear = startDateObj.getFullYear();
  const startMonth = String(startDateObj.getMonth() + 1).padStart(2, "0");
  const startDay = String(startDateObj.getDate()).padStart(2, "0");
  const startDatePortion = `${startYear}-${startMonth}-${startDay}`;

  const endDateObj = new Date(endDate);

  // Format the date portion separately
  const endYear = endDateObj.getFullYear();
  const endMonth = String(endDateObj.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDateObj.getDate()).padStart(2, "0");
  const endDatePortion = `${endYear}-${endMonth}-${endDay}`;


  // Create a start date-time for the given date at 00:00:00
  const start = new Date(`${startDatePortion}T00:00:00`);

  // Create an end date-time for the given date at 23:59:59
  const end = new Date(`${endDatePortion}T23:59:59`);

  try {
    let pipeline = [
      {
        $match: {
          "paymentStatus.type": "fulfilled",
          orderDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          orderStatus: 1,
          orderDate: 1,
          grandTotal: 1,
          "orderItems.productId": 1,
          "orderItems.productName": 1,
          "orderItems.unitPrice": 1,
          "orderItems.quantity": 1,
          "orderItems.price": 1,
          "orderItems.description": 1,
          "orderItems.categoryOffer": 1,
          "orderItems.categoryId": 1,
          "orderItems.categoryName": 1,
          "orderItems.categoryDiscountPecentage": 1,
          "orderItems.productOffer": 1,
          "orderItems.productDiscountPercentage": 1,
          "orderItems.totalPrice": 1,
          tax: 1,
          couponName: 1,
          couponDiscount: 1,
          couponDiscountPercentage: 1,
          shipping: 1,
        },
      },
      {
        $sort: { orderDate: -1 }, // Sort by orderDate in descending order
      },
    ];

    // Assuming you have a model named OrderDB

    const order = await OrderDB.aggregate(pipeline);

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const yearFilter = async (req, res) => {
  const { year } = req.body;

  try {
    let pipeline = [
      {
        $match: {
          "paymentStatus.type": "fulfilled",
          orderDate: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          orderStatus: 1,
          orderDate: 1,
          grandTotal: 1,
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
          tax: 1,
          couponName: 1,
          couponDiscount: 1,
          couponDiscountPercentage: 1,
          shipping: 1,
        },
      },
      {
        $sort: { orderDate: -1 }, // Sort by orderDate in descending order
      },
    ];

    // Assuming you have a model named OrderDB

    const order = await OrderDB.aggregate(pipeline);
   
    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const monthFilter = async (req, res) => {
  const { month } = req.body;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed, so we add 1

  // Calculate the start and end dates for the specified month in the current year
  let startDate = new Date(currentYear, month - 1, 1);
  let endDate = new Date(currentYear, month, 0);

  // Check if the specified month is not available for the current year
  if (currentMonth < month) {
    // Adjust the start and end dates to the same month in the previous year
    startDate = new Date(currentYear - 1, month - 1, 1);
    endDate = new Date(currentYear - 1, month, 0);
  }

  try {
    let pipeline = [
      {
        $match: {
          "paymentStatus.type": "fulfilled",
          orderDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          orderStatus: 1,
          orderDate: 1,
          grandTotal: 1,
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
          tax: 1,
          couponName: 1,
          couponDiscount: 1,
          couponDiscountPercentage: 1,
          shipping: 1,
        },
      },
      {
        $sort: { orderDate: -1 }, // Sort by orderDate in descending order
      },
    ];

    const order = await OrderDB.aggregate(pipeline);

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const top5ProductsMonth = async (req, res) => {
  try {
      const month = parseInt(req.params.month); // Extract the month from the request parameter

      // Check if the month is a valid number (1-12)
      if (isNaN(month) || month < 1 || month > 12) {
          return res.status(400).json({ error: "Invalid month" });
      }

      // Get the start and end date for the specified month in the current year
      const startDate = new Date(new Date().getFullYear(), month - 1, 1); // Month is 0-indexed
      const endDate = new Date(new Date().getFullYear(), month, 0);

      // Aggregate pipeline to find top 5 products for the specified month
      const pipeline = [
          // Match orders within the specified month
          {
              $match: {
                  orderDate: {
                      $gte: startDate,
                      $lte: endDate
                  },
                  "paymentStatus.type": "fulfilled" // Include only fulfilled orders
              }
          },
          // Unwind order items array
          { $unwind: "$orderItems" },
          // Group by product ID and calculate total quantity sold
          {
              $group: {
                  _id: "$orderItems.productId",
                  productName: { $first: "$orderItems.productName" },
                  totalQuantity: { $sum: "$orderItems.quantity" }
              }
          },
          // Exclude _id field from the result
          { $project: { _id: 0, productName: 1, totalQuantity: 1 } },
          // Sort by total quantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to the top 5 products
          { $limit: 5 }
      ];

     

      // Execute the aggregation pipeline
      const topProducts = await OrderDB.aggregate(pipeline);

      // Send the top 5 products for the specified month as JSON response
      res.json(topProducts);
  } catch (error) {
      // Handle errors
      res.status(500).json({ error: "Internal Server Error" });
  }
}

const top5ProductsYear = async (req, res) => {
  try {
      const year = parseInt(req.params.year);

      // return
      // Validate the year input
      if (isNaN(year) || year < 2019 || year > 2024) {
          return res.status(400).json({ error: "Invalid year" });
      }

      // Aggregate pipeline to find top 5 products for the specified year
      const pipeline = [
          // Match orders within the specified year
          {
              $match: {
                  $expr: {
                      $eq: [{ $year: "$orderDate" }, year]
                  },
                  "paymentStatus.type": "fulfilled" // Include only fulfilled orders
              }
          },
          // Unwind order items array
          { $unwind: "$orderItems" },
          // Group by product ID and calculate total quantity sold
          {
              $group: {
                  _id: "$orderItems.productId",
                  productName: { $first: "$orderItems.productName" },
                  totalQuantity: { $sum: "$orderItems.quantity" }
              }
          },
          // Exclude _id field from the result
          { $project: { _id: 0, productName: 1, totalQuantity: 1 } },
          // Sort by total quantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to the top 5 products
          { $limit: 5 }
      ];

      // Execute the aggregation pipeline
      const topProducts = await OrderDB.aggregate(pipeline);

      // Send the top 5 products for the specified year as JSON response
      res.json(topProducts);
  } catch (error) {
      // Handle errors
      res.status(500).json({ error: "Internal Server Error" });
  }
}

const top5CategoriesYear = async (req, res) => {
  try {

      // return
      const year = parseInt(req.params.year);

      // Validate the year input
      if (isNaN(year) || year < 2019 || year > 2024) {
          return res.status(400).json({ error: "Invalid year" });
      }


      // Aggregate pipeline to find top 5 categories for the specified month
      const pipeline = [
          // Match orders within the specified month
          {
              $match: {
                  $expr: {
                      $eq: [{ $year: "$orderDate" }, year]
                  },
                  "paymentStatus.type": "fulfilled" // Include only fulfilled orders
              }
          },
          // Unwind order items array
          { $unwind: "$orderItems" },
          // Group by category ID and calculate total quantity sold
          {
              $group: {
                  _id: "$orderItems.categoryId",
                  categoryName: { $first: "$orderItems.categoryName" },
                  totalQuantity: { $sum: "$orderItems.quantity" }
              }
          },
          // Exclude _id field from the result
          { $project: { _id: 0, categoryName: 1, totalQuantity: 1 } },
          // Sort by total quantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to the top 5 categories
          { $limit: 5 }
      ];

      // Execute the aggregation pipeline
      const topCategories = await OrderDB.aggregate(pipeline);

      // Send the top 5 categories for the specified month as JSON response
      res.json(topCategories);
  } catch (error) {
      // Handle errors
      res.status(500).json({ error: "Internal Server Error" });
  }
}

const top5CategoriesMonth = async (req, res) => {
  try {
      const month = parseInt(req.params.month); // Extract the month from the request parameter

      // Check if the month is a valid number (1-12)
      if (isNaN(month) || month < 1 || month > 12) {
          return res.status(400).json({ error: "Invalid month" });
      }

      // Get the start and end date for the specified month in the current year
      const startDate = new Date(new Date().getFullYear(), month - 1, 1); // Month is 0-indexed
      const endDate = new Date(new Date().getFullYear(), month, 0);

      // Aggregate pipeline to find top 5 categories for the specified month
      const pipeline = [
          // Match orders within the specified month
          {
              $match: {
                  orderDate: {
                      $gte: startDate,
                      $lte: endDate
                  },
                  "paymentStatus.type": "fulfilled" // Include only fulfilled orders
              }
          },
          // Unwind order items array
          { $unwind: "$orderItems" },
          // Group by category ID and calculate total quantity sold
          {
              $group: {
                  _id: "$orderItems.categoryId",
                  categoryName: { $first: "$orderItems.categoryName" },
                  totalQuantity: { $sum: "$orderItems.quantity" }
              }
          },
          // Exclude _id field from the result
          { $project: { _id: 0, categoryName: 1, totalQuantity: 1 } },
          // Sort by total quantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to the top 5 categories
          { $limit: 5 }
      ];

      // Execute the aggregation pipeline
      const topCategories = await OrderDB.aggregate(pipeline);

      // Send the top 5 categories for the specified month as JSON response
      res.json(topCategories);
  } catch (error) {
      // Handle errors
      res.status(500).json({ error: "Internal Server Error" });
  }
}
module.exports = {
  adminLogin,
  adminDashboardPost,
  adminDashboardGet,
  adminLogout,
  pdfDownloading,
  salesReport,
  dateFilter,
  yearFilter,
  monthFilter,
  top5ProductsMonth,
  top5ProductsYear,
  top5CategoriesYear,
  top5CategoriesMonth,
};
