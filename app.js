const express=require("express")
const app=express()
const path=require("path")
// const bodyParser = require('body-parser');
const session=require("express-session")
const logger=require('morgan')
// const nodemailer = require('nodemailer');
// const otpGenerator = require('otp-generator');

const userRoute=require('./router/userRouter')
const adminRoute=require('./router/adminRouter')



app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
    res.header("Expires", 0);
    res.header("Pragma", "no-cache");
    next();
});



app.use(session({
    secret:"secretqwerty",
    resave:false,
    saveUninitialized:true
}))










app.set("view engine","ejs")
app.set("views")







app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Assuming your views are in a 'views' directory

// app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static('public'))







app.use('/',userRoute)
app.use('/admin',adminRoute)


const PORT=process.env.process||3030
app.listen(PORT,()=>{


    

    console.log(`server running on http://localhost:${PORT}`);
})
