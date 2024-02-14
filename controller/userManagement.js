const userDB = require('../models/user');
const productDB = require('../models/product')
const CategoryDB =require('../models/category')
const OrderDB = require('../models/order')
const bcrypt = require('bcrypt');


const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};


const home = async (req, res) => {
    try {
        // console.log(84848);
        let isLogged = null;
        const product = await productDB.find();
        const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

        if (req.session.user) {
            isLogged = req.session.user.name;
            // console.log('userlog');
        } else if (req.session.userNew) {
            // console.log('userNewlog');
            isLogged = req.session.userNew.name;
        }

        return res.render('user/home', { isLogged, product, primaryCategories, otherCategories });
    } catch (err) {
        console.error(err);
        // Handle the error or pass it to a global error handler
        return res.status(500).send('Internal Server Error');
    }
};





 //loginPage
const userLogin=(req, res) => {
    if( req.session.passwordError){
        req.session.passwordError=null
     // console.log(1);
        return  res.render('user/user-login',{isAlert:true}); 
    }
    if(req.session.invalid){
        req.session.invalid=null
     // console.log(2);
        return  res.render('user/user-login',{isAlert2:true}); 
    }
    if(req.session.Blocked){
     // console.log(3);
        req.session.Blocked=null
        return res.render('user/user-login',{isAlert3:true})
    }
        return res.render('user/user-login'); 
    }


const userLoginPost = async (req, res) => {
 // console.log(6666);

    try {
        const { email_Id, password } = req.body;
        const user = await userDB.findOne({ email: email_Id }, { name: 1, email: 1, password: 1, isBlocked: 1 });

        if(!user){
            req.session.invalid=true
            return res.redirect('/loginpage');
        }
        if (user && user.isBlocked === false) {

            
            // Use bcrypt.compare to compare hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                req.session.user = {
                    name: user.name,
                    email: user.email,
                    isBlocked: user.isBlocked,
                };
                if(!req.session.cartId){
                 // console.log('Welcome to home');
                    return res.redirect('/');
                }else{
                 // console.log('session is here');
                 // console.log(req.session.cartId);
                    const cartSession = req.session.cartId
                    req.session.cartId=null
                 // console.log(99);
                    return res.redirect('/cart/'+cartSession)


                }
                
            }
            
            
            else {
                req.session.passwordError = true;
                return res.redirect('/loginpage');
            }
        } else {
            req.session.Blocked = true;// for alert message
            return res.redirect('/loginpage');
        }
    } catch (error) {
        console.error('Invalid user:', error);
    }
};







// signupPage
const userSignupGet=(req,res)=>{
     // console.log(777777);
        if(req.session.userExist){
         // console.log(4545);
            req.session.userExist =null
            return res.render('user/user-register',{isAlert:'user is Exist'})
        }
        else{
         // console.log(22220909);
            return res.render('user/user-register')
        }
}



//signupPost
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const router = require('../router/userRouter');

const userSignupPost = async (req, res) => {
    try {
     // console.log('signuppost');
        const { email, name, password } = req.body;
     // console.log(email, name, password);

        const userData = await userDB.findOne({ email: email });

        if (userData) {
            req.session.userExist = userData.email;
            res.redirect('/signuppage');
        } else {
            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
         // console.log(otp);
            const user = {
                name: name,
                email: email,
                password: hashedPassword, // Save the hashed password in the database
                otp:otp,
            };

            req.session.userNew = {
                email,
                name,
                password: hashedPassword,
                
            };

         // console.log(req.session.userNew.email);
            await userDB.insertMany([user]);
         // console.log(9999);

            

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'adnan.shajahan786@gmail.com',
                    pass: "tgua inbn eelw qljg"
                }
            });

            const mailOptions = {
                from: 'adnan.shajahan@gmail.com',
                to: email,
                subject: 'Welcome to Our Platform!',
                text: `Your OTP is ${otp}. Please don't share it.`,
            };

            // Uncomment the following lines to send the email with OTP
            // transporter.sendMail(mailOptions, function (error, info) {
            //     if (error) {
            //      // console.log(error);
            //     } else {
            //      // console.log('Email sent: ' + info.response);
            //     }
            // });

            // req.session.otp = otp;
         // console.log('User created successfully');
            res.redirect('/otpPage');
        }
    } catch (error) {
        console.error(error);
        // res.send('An error occurred during signup.');
    }
};


//otpPage







const otpPage = async (req, res) => {
 // console.log('otppage');
    const email = req.session.userNew.email; // Retrieve OTP from session
    const otp= await userDB.findOne({ email: email },{otp:1,_id:0});
 // console.log(otp);
    // req.session.userNew=otp
 // console.log(req.session.userNew.email);
    if (otp) {
        setTimeout(async() => {
            // delete req.session.otp;
            // console.log('req.session.otp has been deleted after a few seconds.');
            await userDB.updateOne({ email: email }, { $set: { otp: null } });
            const otpNow=await userDB.findOne({ email: email }, { otp:1,_id:0 });
         // console.log(otpNow,1111);
        }, 30000);
        res.render('user/user-otp', { otp: otp }); // Pass otp variable to the template
    } else {
        res.send('No OTP found');
    }
};





//otpverificationPost

const otpVerificationPost = async(req, res) => {
    try {
     // console.log(191919191);
        const email = req.session.userNew.email; // Retrieve OTP from session
        const otpValue= await userDB.findOne({ email: email },{otp:1,_id:0});
        const otp=otpValue.otp
        const enteredOTP = req.body.otpform; // Assuming the input name in the form is 'otpform'
     // console.log(65656);
     // console.log(otp ,777,enteredOTP);
        if (otp == null || otp === undefined) {
         // console.log(404,'its', null);
            return res.render('user/user-otp', { error: 'Invalid, it\'s expiredkhgvj' });
        } else {
            // const otp = req.session.otp; // Retrieve OTP from session
            if (enteredOTP != otp) {
             // console.log(enteredOTP ,505,  otp);
                return res.render('user/user-otp', { error: 'Incorrect OTP', otp: otp });
            } else {
                req.session.userNew.otp=otp
             // console.log(req.session.userNew);
                return res.redirect('/');
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};






//resendotp
const resendOtp = async (req, res) => {
    try {
        // Retrieve user data from session storage
        const { email, name, password } = req.session.userNew;
     // console.log(505);
        // Generate a new OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        await userDB.updateOne({ email: email }, { $set: { otp: otp } });
        // Email sending code for the new OTP
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'adnan.shajahan786@gmail.com',
                pass: "tgua inbn eelw qljg"
            }
        });
        const mailOptions = {
            from: 'adnan.shajahan@gmail.com',
            to: email, // Use the signup email here
            subject: 'Welcome to Our Platform!',
            text: `your otp is  ${otp} . please don't share`
        };
        // transporter.sendMail(mailOptions, function(error, info) {
        //     if (error) {
        //      // console.log(error);
        //     } else {
        //      // console.log(otp , 1010101);
        //      // console.log('Email sent: ' + info.response);
        //     }
        // });
        // req.session.otp=otp
        res.redirect('/otpPage'); // Redirect after sending the new OTP
    } catch (error) {
        console.error(error);
        res.send('An error occurred while resending OTP.');
    }
};





const logout= async (req,res)=>{
    try{
        delete req.session.user 
        delete req.session.userNew
        delete req.session.cartId
     // console.log('logout');
        res.redirect('/')
    }catch (err){
        console.error();
    }
}
// its correct



































// admin side userManagement
const userlist = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // Get page number from query parameter
            const usersPerPage = 5;
            const skip = (page - 1) * usersPerPage;

            const users = await userDB.find().skip(skip).limit(usersPerPage);
            const totalUsersCount = await userDB.countDocuments();

            const totalPages = Math.ceil(totalUsersCount / usersPerPage);

            if (users.length > 0) {
                return res.render('admin/userlist', { 
                    users, 
                  
                    totalPages,
                    currentPage: page
                });
            } else {
             // console.log('No data found');
                return res.render('admin/userlist', { 
                    users: [], 
                   
                    totalPages: 0,
                    currentPage: 0
                });
            }
        } catch (err) {
         // console.log('Error:', err);
            return res.status(500).render('error', { message: 'Internal Server Error' });
        }
};







const blocking=  async (req,res)=>{
        try{
         // console.log(888888888);
            // console.log(req.params.id);
            const userIdToUpdate=req.params.id
            await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: true } });
            res.redirect('/admin/userList')
        } catch (err){
            console.error(err);
        }
}



const unblocking=  async (req,res)=>{
        try{
            // console.log(req.params.id);
            const userIdToUpdate=req.params.id
            await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: false } });
    res.redirect('/admin/userList')
        } catch (err){
            console.error(err);
        }
    
    
}



const userProfile=async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    try{
        const user = await userDB.findOne({email:emailId})

        console.log(1234321);
       console.log(user);

    
        res.render('user/profile2',{isLogged,user})

    }catch(err){

    }
}



const userAddAddress = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    try{
        const user = await userDB.findOne({ email: emailId });
        const billingDetails = user.billingDetails || []; 
        const userId = user._id
        // console.log(user.id);
        // console.log(userId);
        res.render('user/addAddress',{isLogged,billingDetails,userId})
    }catch(err){
    }
}



const userOrderStatus = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    try{
        const user = await userDB.findOne({ email: emailId });
        const orderList = await OrderDB.find({userId:user.id})
       console.log(orderList);


        res.render('user/orderStatus',{isLogged,orderList})
    }catch(err){
    }
}

const changePassword = (req,res)=>{
    res.redirect('')
}
const forgotPassword = (req,res)=>{
    res.render('user/forgotPassword')
}





module.exports = {
    home,
    logout,
    userlist,
    blocking,
    unblocking,
    userSignupGet,
    userSignupPost,
    otpPage,
    resendOtp,
    otpVerificationPost,
    userLogin,
    userLoginPost,
    userProfile,
    userAddAddress,
    userOrderStatus,
    changePassword,
    forgotPassword,

};
