require('dotenv').config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;


const userDB = require('../models/user');
const productDB = require('../models/product')
const CategoryDB =require('../models/category')
const OrderDB = require('../models/order')
const bcrypt = require('bcrypt');
const CouponDB =require('../models/coupon')
const CartDB =require('../models/cart')


const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const determineIsLogged = (session) => {
    return session.user ? session.user.name : (session.userNew ? session.userNew.name : null);
};


const home = async (req, res) => {
    try {
        let isLogged = null;
        const product = await productDB.find();
        const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

        if (req.session.user) {
            isLogged = req.session.user.name;
        } else if (req.session.userNew) {
            isLogged = req.session.userNew.name;
        }

        return res.render('user/home', { isLogged, product, primaryCategories, otherCategories });
    } catch (err) {

res.redirect('/error')  
  }
};





 //loginPage
const userLogin=(req, res) => {

    if( req.session.passwordError){
        req.session.passwordError=null
        return  res.render('user/user-login',{isAlert:true}); 
    }
    if(req.session.invalid){
        req.session.invalid=null
        return  res.render('user/user-login',{isAlert2:true}); 
    }
    if(req.session.Blocked){
        req.session.Blocked=null
        return res.render('user/user-login',{isAlert3:true})
    }
        return res.render('user/user-login'); 
    }


const userLoginPost = async (req, res) => {

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
                    return res.redirect('/');
                }else{
                    const cartSession = req.session.cartId
                    req.session.cartId=null
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
        res.redirect('/error')
    }
};







// signupPage
const userSignupGet=(req,res)=>{
        if(req.session.userExist){
            req.session.userExist =null
            return res.render('user/user-register',{isAlert:'user is Exist'})
        }
        else{
            return res.render('user/user-register')
        }
}



//signupPost
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

const userSignupPost = async (req, res) => {
    try {
        const { email, name, password } = req.body;
    const  referralCode = (req.body.referralCode)??null
    if (referralCode) {
        const referredUser = await userDB.findOneAndUpdate(
            { referral: referralCode }, 
            { $inc: { wallet: 100 } },
            {new:true}
        );
        const transaction = {
            type: 'credit',
            amount: 100,
            isReferral:true,
            timestamp: Date.now()
          };
          referredUser.transactions.push(transaction);
          await referredUser.save();
    }
        const userData = await userDB.findOne({ email: email });
        if (userData) {
            req.session.userExist = userData.email;
            res.redirect('/signuppage');
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            const user = {
                name: name,
                email: email,
                password: hashedPassword, // Save the hashed password in the database
                otp:otp,
                wallet:(referralCode)?50:undefined,
                transactions: [] // Initialize transactions array
            };
            if (referralCode) {
                const transaction = {
                    type: 'credit',
                    amount: 50,
                    isReferral: true,
                    timestamp: Date.now()
                };
                user.transactions.push(transaction); // Add transaction to user's transactions array
            }
            req.session.newUser = {
                email,
                name,
                password: hashedPassword,
                
            };
            await userDB.insertMany([user]);
            console.log('adnan.shajahan786@gmail.com' , 'something is checking');
            

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

            await transporter.sendMail(mailOptions);

         
            res.redirect('/otpPage');
        }
    } catch (error) {
        console.log('kittiye');
        
        res.redirect('/error')
    }
};


//otpPage




const otpPage = async (req, res) => {
    try {
        const email = (req.session.user) ? req.session.user.email : (req.session.newUser) ? req.session.newUser.email : req.session.email;

        if (!email) {
            throw new Error("Email is required");
        }
        const isOtp = await userDB.findOne({ email }, { otp: 1, _id: 0 });

        let otp;
        if(isOtp.otp==null){
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            await userDB.findOneAndUpdate(
                { email: email }, 
                { $set: { otp: otp } }, 
            );
        }

        if(req.session.resendOtp){
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

            await transporter.sendMail(mailOptions);
        }






        if (isOtp) {
            setTimeout(async () => {
                await userDB.updateOne({ email }, { $set: { otp: null } });
            }, 30000);
            res.render('user/user-otp', { otp:isOtp });
        } else {
            res.send('No OTP found');
        }
    } catch (error) {
        res.redirect('/error')
    }
};







//otpverificationPost


const otpVerificationPost = async (req, res) => {
    try {
        const email = (req.session.user) ? req.session.user.email : (req.session.newUser) ? req.session.newUser.email : req.session.email;

        const otpValue = await userDB.findOne({ email: email }, { otp: 1, _id: 0 });
        const otp = otpValue.otp;
        const enteredOTP = req.body.otp; // Assuming the input name in the form is 'otpform'
            if (enteredOTP != otp) {
                return res.status(400).json({ error: 'Incorrect OTP', otp: otp });
            } else {


                if (req.session.newUser) req.session.newUser.otp = otp;
                req.session.userNew = req.session.newUser??null
                req.session.user && (req.session.user.otp = otp); //nullish coalesing
                // const email = req.session.email
                const name =await userDB.find({email:email},{name:1,_id:0})
                const generatedReferralCode = otpGenerator.generate(6, { alphabets: true, upperCase: false, specialChars: false, digits: true });
                const referralCode = await userDB.findOneAndUpdate({email:email}, { $set: { referral: generatedReferralCode } });

                const username=name[0].name
                req.session.user={
                    name:username,
                    email:email
                }
                
                return res.status(200).json({ success: true });
            }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};







const updatePasswordPost = async (req, res) => {
    try {



        const { email, password } = req.body;
        req.session.email=email
        // Find the user by email
        const user = await userDB.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (req.session.user && req.session.user.email !== user.email) {
            return res.status(404).json({ message: 'your email is not correct' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
       
        // Save the OTP in the user document
        user.password = hashedPassword
        user.otp = otp;
        // await user.otp.save();
        await user.save();



        // Send OTP to the user via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'adnan.shajahan786@gmail.com',
                pass: 'tgua inbn eelw qljg'
            }
        });
        const mailOptions = {
            from: 'adnan.shajahan@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is ${otp}. Please don't share it.`,
        };

        await transporter.sendMail(mailOptions);
      

        if(req.session.userNew){
            req.session.updatePassword = true
            return res.redirect('/otpPage');
        }
       

                res.redirect('/otpPage'); // Redirect to the OTP verification page
    } catch (error) {
        // return res.status(500).json({ message: 'Internal server error.' });
        res.redirect('/error')
    }
};






const logout= async (req,res)=>{
    try{
        delete req.session.user 
        delete req.session.userNew
        delete req.session.cartId
        res.redirect('/')
    }catch (err){
        res.redirect('/error')
    }
}



































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
                return res.render('admin/user-list', { 
                    users, 
                  
                    totalPages,
                    currentPage: page
                });
            } else {
                return res.render('admin/user-list', { 
                    users: [], 
                   
                    totalPages: 0,
                    currentPage: 0
                });
            }
        } catch (err) {

            return res.status(500).render('/error', { message: 'Internal Server Error' });
        }
};







const blocking=  async (req,res)=>{
        try{
        
            const userIdToUpdate=req.params.id
            await userDB.find({_id:userIdToUpdate},{name:1,_id:0})

            
            await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: true } });


            res.redirect('/admin/userList')
        } catch (err){
            res.redirect('/error')
        }
}



const unblocking=  async (req,res)=>{
        try{
            const userIdToUpdate=req.params.id
            await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: false } });
    res.redirect('/admin/userList')
        } catch (err){
            res.redirect('/error')
        }
    
    
}



const userProfile=async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;



    const isPasswordChanged=(req.session.changePassword)??null
    req.session.changePassword =null
       try{
        const user = await userDB.findOne({email:emailId})

    
        res.render('user/user-profile',{isLogged,user,isPasswordChanged})

    }catch(err){
res.redirect('/error')
    }
}



const userAddAddress = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    try{
        const user = await userDB.findOne({ email: emailId });
        const billingDetails = user.billingDetails || []; 
        const userIdJson = user._id
        const userId=userIdJson.toString()
        res.render('user/add-address',{isLogged,billingDetails,userId})
    }catch(err){
        res.redirect('/error')
    }
}



const userOrderStatus = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;

    try{
        const user = await userDB.findOne({ email: emailId });
        const orderList = await OrderDB.find({userId:user.id})



        res.render('user/order-status',{isLogged,orderList})
    }catch(err){
res.redirect('/error')
    }
}






const updatePassword = async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const emailId = req.session.user ? req.session.user.email : req.session.userNew? req.session.userNew.email:null

    try{
        req.session.updateOrForgotPassword = true
        res.render('user/update-password',{isLogged})
    }catch(err){
res.redirect('/error')
    }

}


const forgotPassword = (req,res)=>{
    res.render('user/forgot-password')
}


const wallet = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try{

        const user =await userDB.findOne({email:emailId})

        user.transactions.forEach(transaction => {
            transaction.formattedTimestamp = new Date(transaction.timestamp).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });
        });




        res.render('user/wallet',{isLogged ,user})

    }catch(err){
res.redirect('/error')
    }

}

const changeName = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try{

        const user =await userDB.findOne({email:emailId})

        user.name = req.body.newName;
        await user.save();


        if( req.session.user){
            req.session.user.name=user.name
        }else if(req.session.userNew){
            req.session.userNew.name=user.name
        }

        
        

        res.status(200).json({ message: 'Name updated successfully', newName: user.name });


    }catch(err){
        res.status(500).json({ error: 'Failed to update name' });

    }

}



const editAddress=async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try{


        const {billingId,name,telephone,address,city,postcode,state,} = req.body.requestBody

        const telephoneParsed=  parseInt(telephone);
        const postcodeParsed=  parseInt(postcode);
        const _id = billingId

const updatedAddress = {
    name,
    telephone:telephoneParsed,
    address,
    city,
    postCode:postcodeParsed,
    regionState:state,
    _id:_id
}

        const user = await userDB.findOne({ email: emailId });


        if (!user) {
            throw new Error("User not found");
        }

        const index = user.billingDetails.findIndex(details => details._id.toString() === billingId);



        if (index === -1) {
            throw new Error("Billing details not found");
        }

        user.billingDetails[index] = updatedAddress

        await user.save();

        res.status(200).json({ message: "Billing address updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



  const repaymentController = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Retrieve the order from the database
        const order = await OrderDB.findById(orderId)
            .populate({
                path: 'orderItems',
                populate: {
                    path: 'productId',
                    populate: {
                        path: 'categoryId'
                    }
                }
            })
            .populate('couponId');

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order is eligible for repayment

        // Calculate repayment details
        // Example: Calculate repayment amount by applying refunds for products, categories, and coupons
        let repaymentAmount = order.grandTotal;

        // Apply refunds for products
        for (const orderItem of order.orderItems) {
            // Apply product offer refund if applicable
            if (orderItem.productOffer) {
                repaymentAmount += orderItem.productOffer;
            }
            
            // Apply category offer refund if applicable
            if (orderItem.categoryOffer) {
                repaymentAmount += orderItem.categoryOffer;
            }
        }

        // Apply coupon discount refund if applicable
        if (order.couponDiscount) {
            repaymentAmount += order.couponDiscount;
        }
        return res.status(200).json({ repaymentAmount });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
                          



module.exports = {
    home,
    logout,
    userlist,
    blocking,
    unblocking,
    userSignupGet,
    userSignupPost,
    otpPage,
    otpVerificationPost,
    userLogin,
    userLoginPost,
    userProfile,
    userAddAddress,
    userOrderStatus,
    updatePassword,
    forgotPassword,
    updatePasswordPost,
    wallet,
    changeName,
    editAddress,
    

};
