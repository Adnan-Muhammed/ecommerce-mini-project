const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");

const userRoute = require("./router/userRouter");
const adminRoute = require("./router/adminRouter");
const cartRoute = require("./router/cartRouter");
const wishlistRoute = require("./router/wishlistRouter");
const checkoutRoute = require("./router/checkoutRouter");
const orderRouter = require("./router/orderRouter");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  res.header("Expires", 0);
  res.header("Pragma", "no-cache");
  next();
});

app.use(
  session({
    secret: "secretqwerty",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  if (req.session.user || req.session.userNew) {
    delete req.session.admin;
  }
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Assuming your views are in a 'views' directory

app.use(express.static(path.join(__dirname, "public")));

// app.get('/wishlist/remove/:wishlistId', async (req,res)=>{
//   const WishlistDB = require('./models/wishlist');
//   const wishlistIdToRemove = req.params.wishlistId

//   await WishlistDB.findOneAndDelete({ _id: wishlistIdToRemove });//first
  
  
//       // Redirect back to the cart page or send a success response
//       res.redirect('/wishlist'); // You can change this to the appropriate URL
  
// });


app.use("/", userRoute);
app.use("/admin", adminRoute);
app.use(cartRoute);
app.use(checkoutRoute);
app.use(orderRouter);
app.use(wishlistRoute);

app.get("/error", (req, res) => {
  res.render("user/404");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
