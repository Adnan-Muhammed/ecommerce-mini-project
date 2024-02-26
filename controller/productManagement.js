// const CategoryDB=require('../../models/category')
const CategoryDB = require("../models/category");
const productDB = require("../models/product");
const CartDB = require("../models/cart");
const multer = require("multer");
const path = require("path");
const upload = multer({ dest: "public/uploads/" });
const fetchCategoryMiddleware = require("../middleware/fetchCategoryData");
const mongoose = require("mongoose");

const determineIsLogged = (session) => {
  return session.user
    ? session.user.name
    : session.userNew
    ? session.userNew.name
    : null;
};

//user side-=-=-=-=-

// const productListUser = async (req, res) => {
//     const isLogged = determineIsLogged(req.session);
//     const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
//     const  categoryData  = req.params.id.toUpperCase()
//     try {
//      // console.log(565656);
//         const isCategory=await CategoryDB.find({name:categoryData,isAvailable:true})
//         const  product=await productDB.find({isAvailable:true,categoryName:categoryData})
//         if(isCategory&&product){
//          // console.log(product)
//             res.render('user/productlist',{isLogged,product,primaryCategories, otherCategories})
//         }
//     } catch (err) {
//         console.error(err);
//     }
// }

//gpt

//==-=-=-=-=-=-

//admin side -=-=-=-=-=-

const productListAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get page number from query parameter
    const productsPerPage = 5;
    const skip = (page - 1) * productsPerPage;

    const productList = await productDB
      .find()
      .populate('categoryId') // Populate category information

      .skip(skip)
      .limit(productsPerPage);
    const totalProductsCount = await productDB.countDocuments();
    // console.log(totalProductsCount);

    const totalPages = Math.ceil(totalProductsCount / productsPerPage);

    // const productList=await productDB.find()
    // console.log(productList.length);
    if (productList.length > 0) {
      console.log('listed',productList);
      res.render("admin/productlist", {
        productList,
        totalPages,
        currentPage: page,
      });
    } else {
      // console.log('NO DATA');
      res.render("admin/categorylist");
    }
  } catch (err) {
    console.error("sorry");
  }
};

const addProduct = async (req, res) => {
  try {
    // console.log('rrrrr');
    const categoryList = await CategoryDB.find(
      { isAvailable: true },
      { name: 1, _id: 1 }
    );
    const multerError = req.session.multerError;
    req.session.multerError = null;
    res.render("admin/addproduct", { categoryList, multerError });
  } catch (err) {
    console.error(err);
  }
};





const productadded = async (req, res) => {
  console.log(req.body.productCategory);
  console.log('yy',78);
  let imageCount = 4;
  const existingProductId = req.params.id ?? null;

  if (req.params.id) {
    const existingProductId = req.params.id;
    const existingProduct = await productDB.findById(existingProductId);
    const ExistingImgCount = existingProduct.image.length;
    console.log(ExistingImgCount);
    imageCount = 4 - ExistingImgCount;
  }

  upload.array("images", imageCount)(req, res, async function (err) {
    console.log(imageCount);
    console.log(78534567);

    // console.log(req.body.productCategory);
    // console.log('-1-1',909);

    if (err instanceof multer.MulterError) {
      console.log(`err is length : ${req.files.length}`);
      if (req.params.id) {
        req.session.multerError = true;
        return res.redirect(`/admin/productUpdate/${existingProductId}`);
      } else {
        req.session.multerError = true;
        return res.redirect("/admin/addProduct");
      }
      // return res.status(400).send({ message: 'Multer error' });
    } else if (err) {
      return res.status(500).send({ message: "Server error" });
    }

    try {
      // if (!req.files || req.files.length === 0) {
      //     return res.status(400).send({ message: 'No files were uploaded.' });
      //     }
      const newImages = req.files.map((file) => file.path.substring(6));
      console.log(req.body.productCategory);
      console.log('zz',99);

      if (req.body.productCategory) {
        const newProduct = {
          name: req.body.productName,
          price: req.body.productPrice,
          stock: req.body.productStock,
          // categoryName: req.body.productCategory,
          categoryId: req.body.productCategory,
          // categoryId: category._id,  // Assign categoryId

          description: req.body.productDescription,
          image: newImages,
        };
        // console.log(101,req.body.productDescription.trim(),999);

        console.log('products');
        console.log(newProduct);
        await productDB.insertMany([newProduct]);
        req.session.productAdded = newProduct;
      } else {
        const productId = req.params.id;
        const existingProduct = await productDB.findById(productId);

        const updateProduct = {
          name: req.body.productName,
          price: req.body.productPrice,
          stock: req.body.productStock,
          description:
            req.body.productDescription.trim() !== ""
              ? req.body.productDescription
              : existingProduct.description,
          image:
            // (newImages.length > 0 && existingProduct.image) ? [...newImages, ...existingProduct.image]:(newImages.length>0)?newImages:(existingProduct.image.length>0)?existingProduct.image:null

            (newImages.length > 0 && existingProduct&& existingProduct.image.length > 0)
      ? [...newImages, ...existingProduct.image]
      : (newImages.length > 0)
      ? newImages
      : (existingProduct.image.length > 0)
      ? existingProduct.image
      : null,
        
          };
        // console.log(existingProduct.description);
        const editing = await productDB.findByIdAndUpdate(
          productId,
          updateProduct
        );
      }

      return res.redirect("/admin/productlist");
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Error adding product" });
    }
  });
};

//-=-=-=-=-

//productUnlist admin
const productUnlist = async (req, res) => {
  try {
    // console.log(1111111);
    const productId = req.params.id;
    // console.log(productId);
    const productishere = await productDB.find({ _id: productId });
    // console.log(productishere);
    const nowproduct = await productDB.updateOne(
      { _id: productId },
      { $set: { isAvailable: false } }
    );
    // console.log(nowproduct);
    res.redirect("/admin/productlist");
  } catch (err) {
    console.error(err);
  }
};
const productDelete = async (req, res) => {
  try {
    // console.log('deleting');
    const productId = req.params.id;
    // console.log(productId);
    const productishere = await productDB.find({ _id: productId });
    // console.log(productishere);
    const nowproduct = await productDB.deleteOne({ _id: productId });
    const removeFromCart = await CartDB.deleteOne({ productId: productId });
    // console.log(nowproduct);
    // console.log(removeFromCart);
    res.redirect("/admin/productlist");
  } catch (err) {
    console.error(err);
  }
};

const productList = async (req, res) => {
  try {
    //  console.log(2222);
    const productId = req.params.id;
    // console.log(productId);
    const productishere = await productDB.find({ _id: productId });
    // console.log(productishere);
    const nowproduct = await productDB.updateOne(
      { _id: productId },
      { $set: { isAvailable: true } }
    );
    // console.log(nowproduct);
    res.redirect("/admin/productlist");
  } catch (err) {
    console.error(err);
  }
};

const productUpdate = async (req, res) => {
  const multerError = req.session.multerError;
  req.session.multerError = null;
  try {
    const productId = req.params.id;
    // console.log('updating this product');
    const editProduct = await productDB.findById(productId);
    // console.log(editProduct.name);
    res.render("admin/editProduct", { editProduct, multerError });
  } catch (err) {}
};

const productUpdatePost = async (req, res) => {
  try {
    const updateProduct = req.params.id;
    const updatedProduct = await productDB
      .findById(updateProduct)
      .select("name isAvailable image");
    // console.log(updatedProduct);
  } catch (err) {}
};

// const productImgDelete=async(req,res)=>{
//     try{
//         const productObjectId=req.params.id
//         req.session.productId=productObjectId

//         const url=req.params.imgUrl
//      // console.log(121212);
//         const imgUrl=`\\uploads\\${url}`
//      // console.log(imgUrl);

//         const img=await productDB.updateOne(
//             { _id: productObjectId },
//             { $pull: { image: imgUrl } }
//           );
//           res.redirect(`/admin/productUpdate/${productObjectId}`)
//     }catch(err){
//         console.error(err);
//     }
// }

const productImgDelete = async (req, res) => {
  try {
    const productObjectId = req.params.id;
    const imgUrl = req.params.imgUrl;
    // Construct the image URL consistent with the database format
    const imgPath = `\\uploads\\${imgUrl}`; // Assuming your database stores URLs with forward slashes
    // Remove the image path from the product's image array
    const img = await productDB.updateOne(
      { _id: productObjectId },
      { $pull: { image: imgPath } }
    );
    // Send a success response
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" }); // Send an error response
  }
};

//
const productDetail = async (req, res) => {
  // console.log(1818);
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } =
    await fetchCategoryMiddleware.fetchCategories();
  try {
    // console.log(isLogged);
    const productId = req.params.id;
    // console.log(productId,1111);

    // Extract the valid ObjectId from the provided string
    const validObjectId = new mongoose.Types.ObjectId(productId);

    // Use the valid ObjectId to query the database
    const productDetails = await productDB.findById(validObjectId);

    // const productDetails=await productDB.findById(productId)
    // console.log(productDetails,444);
    // console.log(222);
    // const session = req.session.cartProduct
    const session = (req.session.cartProduct)??null
    delete req.session.cartProduct
    res.render("user/product-detail", {
      session,
      productDetails,
      isLogged,
      primaryCategories,
      otherCategories,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid product ID");
  }
};

const userSideproductDetails = (req, res) => {
  res.render("user/product-details-zoom");
};

//orginal
const productListUser = async (req, res) => {
  console.log("asdfghjklertyui wertyu sdfghj xcvbn");
  const isLogged = determineIsLogged(req.session);
  const { primaryCategories, otherCategories } =
    await fetchCategoryMiddleware.fetchCategories();
  const categoryName = req.params.id;
  const categoryData = req.params.id.toUpperCase();

  // const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to page 1
  // const limit = 4; // Number of items per page


  try {



    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to page 1
    const limit = 4; // Number of items per page

    // Find the category by name to get its ID
    const category = await CategoryDB.findOne({ name: categoryData,isAvailable:true });
    if (!category) {
      throw new Error('Category not found'); // Handle case where category doesn't exist
    }
    const categoryId = category._id;

    const totalProductsCount = await productDB.countDocuments({
      isAvailable: true,
      categoryId: categoryId, // Match products by categoryId
    });
    const totalPages = Math.ceil(totalProductsCount / limit);
    const offset = (page - 1) * limit;

    const products = await productDB
      .find({ isAvailable: true, categoryId: categoryId }) // Match products by categoryId
      .skip(offset)
      .limit(limit)
      .populate('categoryId'); // Populate category information



    // const totalProductsCount = await productDB.countDocuments({
    //   isAvailable: true,
    //   categoryName: categoryData,
    // });
    // // console.log(`total products count is ${totalProductsCount}`);
    // const totalPages = Math.ceil(totalProductsCount / limit);
    // const offset = (page - 1) * limit;

    // const products = await productDB
    //   .find({ isAvailable: true, categoryName: categoryData })
    //   .skip(offset)
    //   .limit(limit);

    console.log(products);



    res.render("user/productlist", {
      isLogged,
      product: products,
      primaryCategories,
      otherCategories,
      totalPages,
      currentPage: page,
      categoryName,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/error')
  }
};

const fetchData = async (req, res) => {
  console.log('fetchData');
 const descending = parseInt(req.body.descending)
  console.log('lol');
  const categoryData = req.params.id.toUpperCase();
  const minValueParsing = req.body.minValue;
  const maxValueParsing = req.body.maxValue;

  const minValue = parseInt(minValueParsing);
  const maxValue = parseInt(maxValueParsing);

  console.log(minValue, maxValue);
  const searchTerm = req.body.searchTerm || null;
  console.log(searchTerm);
  const regex = /₹(\d+)\s*-\s*₹(\d+)/;

  try {
    const page = parseInt(req.body.page) || 1; // Get the page number from the query parameter, default to page 1

    console.log(page,'ki');
    const limit = 4; // Number of items per page
    const offset = (page - 1) * limit;

    const category = await CategoryDB.findOne({ name: categoryData,isAvailable:true });
    if (!category) {
      throw new Error('Category not found'); // Handle case where category doesn't exist
    }
    const categoryId = category._id;

    const pipeline = [
      {
        $match: {
          categoryId: categoryId,
          price: { $gte: minValue, $lte: maxValue },
          isAvailable: true,
          // name: searchTerm
          //   ? { $regex: new RegExp(searchTerm, "i") }
          //   : { $exists: true }, // Include name field conditionally
          ...(searchTerm && { name: searchTerm }), // Include name field conditionally
        },
      },
      {
        $sort: {
          price: descending  || 1
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: page } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ];
    const [{ metadata, data }] = await productDB.aggregate(pipeline);
    const totalDocs = metadata.length > 0 ? metadata[0].total : 0;
    const totalPages = Math.ceil(totalDocs / limit);
    console.log('kijvf');
    console.log(data);

    res.json({
      sortedProducts: data,
      currentPage: page,
      totalPages,
      categoryData,
      minValue,
      maxValue,
      searchTerm
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const priceSortDescending = async (req, res) => {
  console.log("its descending");
  const { value, searchTerm } = req.body.value;
  // const priceString=data.value
  console.log(12345678);
  console.log(898);

  console.log("priceSortDescending");

  // console.log(priceString);
  const regex = /₹(\d+)\s*-\s*₹(\d+)/;
  const match = value.match(regex);
  // console.log(match);
  const minValue = parseInt(match[1], 10);
  const maxValue = parseInt(match[2], 10);
  console.log(minValue, maxValue);

  const categoryData = req.params.id.toUpperCase();
  // console.log(categoryData,222);
  const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to page 1
  // console.log(page,999);
  const limit = 4; // Number of items per page

  try {

    const category = await CategoryDB.findOne({ name: categoryData,isAvailable:true });
    if (!category) {
      throw new Error('Category not found'); // Handle case where category doesn't exist
    }
    const categoryId = category._id;


    // const pipeline = [
    //   {
    //     $match: {
    //       categoryName: categoryData,
    //       price: { $gte: minValue, $lte: maxValue },
    //       isAvailable: true,
    //       ...(searchTerm && { name: searchTerm }), // Include name field conditionally
    //     },
    //   },
    //   {
    //     $sort: {
    //       price: 1, // 1 for ascending, -1 for descending
    //     },
    //   },
    //   {
    //     $count: "documentCount",
    //   },
    // ];
    // const totalProductsCount = await productDB.aggregate(pipeline);
    // // console.log(totalProductsCount);
    // console.log(totalProductsCount[0].documentCount);


    const totalProductsCount = await productDB.countDocuments({
      isAvailable: true,
      categoryId: categoryId,
      price: { $gte: minValue, $lte: maxValue }, // Price range condition
      ...(searchTerm && { name: searchTerm }), // Include name field conditionally
    });
    console.log(totalProductsCount, "99");
    console.log(1234);
    const countValue = totalProductsCount;
    // console.log(countValue);
    // console.log(`filtered products count is ${countValue}`);

    const totalPages = Math.ceil(countValue / limit);
    // console.log(totalPages);
    // console.log(7876);

    const offset = (page - 1) * limit;

    const pipeline2 = [
      {
        $match: {
          categoryId: categoryId,
          price: { $gte: minValue, $lte: maxValue },
          isAvailable: true,
          ...(searchTerm && { name: searchTerm }), // Include name field conditionally
        },
      },
      {
        $sort: {
          price: -1, // 1 for ascending, -1 for descending
        },
      },
    ];
    const sortedProducts = await productDB
      .aggregate(pipeline2)
      .skip(offset)
      .limit(limit);
    // console.log('hello');
    res.json({
      sortedProducts,
      totalPages,
      currentPage: page,
      categoryData,
      minValue,
      maxValue,
      searchTerm,
      descending:-1,
    });
  } catch (err) {
    console.error(err);
  }
};

const priceSortAscending = async (req, res) => {
  console.log("priceSortAscend");
  console.log("its ascending");
  const { value, searchTerm } = req.body.value;
  console.log(12345678);
  console.log(898);
  const regex = /₹(\d+)\s*-\s*₹(\d+)/;
  const match = value.match(regex);
  // console.log(match);
  const minValue = parseInt(match[1], 10);
  const maxValue = parseInt(match[2], 10);
  console.log(minValue, maxValue);
  const categoryData = req.params.id.toUpperCase();
  // console.log(categoryData,222);
  const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to page 1
  // console.log(page,999);
  const limit = 4; // Number of items per page

  try {

    const category = await CategoryDB.findOne({ name: categoryData,isAvailable:true });
    if (!category) {
      throw new Error('Category not found'); // Handle case where category doesn't exist
    }
    const categoryId = category._id;

    

   
    const totalProductsCount = await productDB.countDocuments({
      isAvailable: true,
      categoryId: categoryId,
      price: { $gte: minValue, $lte: maxValue }, // Price range condition
      ...(searchTerm && { name: searchTerm }), // Include name field conditionally
    });
    console.log(totalProductsCount, "99");
    const countValue = totalProductsCount;
    console.log(countValue, "787");
    // console.log(`filtered products count is ${countValue}`);
    const totalPages = Math.ceil(countValue / limit);
    // console.log(totalPages);
    // console.log(7876);
    const offset = (page - 1) * limit;
    const pipeline2 = [
      {
        $match: {
          categoryId: categoryId,
          price: { $gte: minValue, $lte: maxValue },
          isAvailable: true,
          ...(searchTerm && { name: searchTerm }), // Include name field conditionally
        },
      },
      {
        $sort: {
          price: 1, // 1 for ascending, -1 for descending
        },
      },
    ];
    const sortedProducts = await productDB
      .aggregate(pipeline2)
      .skip(offset)
      .limit(limit);
    // console.log('hello');
    res.json({
      sortedProducts,
      totalPages,
      currentPage: page,
      categoryData,
      minValue,
      maxValue,
      searchTerm,
    });
  } catch (err) {
    console.error(err);
  }
};

const searchProduct = async (req, res) => {
  const categoryData = req.params.id.toUpperCase();
  const searchValue = req.body.searchTerm;
  const priceString = req.body.value;
  const regex = /₹(\d+)\s*-\s*₹(\d+)/;
  const match = priceString.match(regex);
  const minValue = parseInt(match[1], 10);
  const maxValue = parseInt(match[2], 10);

  try {
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to page 1
    const limit = 4; // Number of items per page
    const offset = (page - 1) * limit;

    const category = await CategoryDB.findOne({ name: categoryData,isAvailable:true });
    if (!category) {
      throw new Error('Category not found'); // Handle case where category doesn't exist
    }
    const categoryId = category._id;

    const pipeline = [
      {
        $match: {
          categoryId: categoryId,
          price: { $gte: minValue, $lte: maxValue },
          isAvailable: true,
          name: { $regex: searchValue, $options: "i" }, // Case-insensitive search
        },
      },
      {
        $sort: {
          price: 1, // 1 for ascending, -1 for descending
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: page } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ];

    const [{ metadata, data }] = await productDB.aggregate(pipeline);

    const totalDocs = metadata.length > 0 ? metadata[0].total : 0;
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      searchProducts: data,
      currentPage: page,
      totalPages,
      categoryData,
      minValue,
      maxValue,
      searchTerm: searchValue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addProduct,
  productadded,
  productListAdmin,
  //new codes
  // userSideProductlist,
  userSideproductDetails,
  productListUser,
  productUnlist,
  productDelete,
  productList,
  productUpdate,
  productUpdatePost,
  productImgDelete,
  productDetail,
  //new
  priceSortAscending,
  priceSortDescending,
  searchProduct,
  fetchData,
};
