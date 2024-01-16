const session = require('express-session');
const userDB = require('../models/user');
const productDB = require('../models/product')
const CategoryDB =require('../models/category')

const fetchCategoryMiddleware = require('../middleware/fetchCategoryData');

const home = async (req, res) => {
    try {
        console.log(84848);
        let isLogged = null;
        const product = await productDB.find();
        const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();

        if (req.session.user) {
            isLogged = req.session.user.name;
            console.log('userlog');
        } else if (req.session.userNew) {
            console.log('userNewlog');
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
        console.log(1);
        return  res.render('user/user-login',{isAlert:true}); 
    }
    if(req.session.invalid){
        req.session.invalid=null
        console.log(2);
        return  res.render('user/user-login',{isAlert2:true}); 
    }
    if(req.session.Blocked){
        console.log(3);
        req.session.Blocked=null
        return res.render('user/user-login',{isAlert3:true})
    }
        return res.render('user/user-login'); 
    }


//loginPost
const userLoginPost=  async (req,res)=>{
    console.log(6666);
    try{
        const {email_Id,password}=req.body
        const user=await userDB.findOne({email:email_Id},{name:1,email:1,password:1,isBlocked:1})
        if(user.isBlocked==false){
            if(user.password==password){
                req.session.user={
                    name:user.name,
                    email:user.email,
                    isBlocked:user.isBlocked,
                }
                console.log('welcome to home');
                return res.redirect('/')
            }
            if(user.password!=password){
            const isPasswordError="yes"
            req.session.passwordError= isPasswordError//true
            return res.redirect('/loginpage')
            }
        }else{
            req.session.Blocked=true
            return res.redirect('/loginpage')
        }
    }
    catch{
        console.log('invalid  no user');
        const isValid="no"
        req.session.invalid=isValid
        console.log(1111);
        return res.redirect('/loginpage')
    }
}


// signupPage
const userSignupGet=(req,res)=>{
        console.log(777777);
         res.render('user/user-register')
}



//signupPost
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');
const userSignupPost = async (req, res) => {
    try {
        console.log('signuppost');
        const { email, name, password } = req.body;
        console.log(email, name, password);
        const userData = await userDB.findOne({ email: email });
        if (userData) {
            req.session.userExist = userData.name;
            res.redirect('/signuppage');
        } else {
            const user = {
                name: name,
                email: email,
                password:password
            };
            req.session.userNew = {
                email,
                name,
                password
            };
            console.log(req.session.userNew.email);
            await userDB.insertMany([user]);
            console.log(9999);

            const otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
              });
            console.log(otp);
            // Email sending code here on successful signup
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
// sent mail otp
            // transporter.sendMail(mailOptions, function (error, info) {
            //     if (error) {
            //         console.log(error);
            //     } else {
            //         console.log(otp, 1010101);
            //         console.log('Email sent: ' + info.response);
            //     }
            // });


            req.session.otp=otp
            console.log('its created');
            res.redirect('/otpPage');
        }
    } catch (error) {
        console.error(error);
        res.send('An error occurred during signup.');
    }
};


//otpPage


const otpPage = async (req, res) => {
    console.log('otppage');
    const otp = req.session.otp; // Retrieve OTP from session
    // req.session.userNew=otp
    console.log(req.session.userNew.email);
    if (otp) {
        setTimeout(() => {
            delete req.session.otp;
            console.log('req.session.otp has been deleted after a few seconds.');
        }, 30000);
        res.render('user/user-otp', { otp: otp }); // Pass otp variable to the template
    } else {
        res.send('No OTP found');
    }
};



//otpverificationPost
const otpVerificationPost = (req, res) => {
    try {
        console.log(191919191);
        console.log(req.session.otp, 777777);
        const enteredOTP = req.body.otpform; // Assuming the input name in the form is 'otpform'
        if (req.session.otp == null || req.session.otp === undefined) {
            return res.render('user/user-otp', { error: 'Invalid, it\'s expired' });
        } else {
            const otp = req.session.otp; // Retrieve OTP from session

            if (enteredOTP !== otp) {
                return res.render('user/user-otp', { error: 'Incorrect OTP', otp: otp });
            } else {
                req.session.userNew.otp=otp
                console.log(req.session.userNew);
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
        const { email, name, password } = req.session.userData;
        console.log(505);
        // Generate a new OTP
        const newOTP = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
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
            text: `your otp is  ${newOTP} . please don't share`
        };
        // transporter.sendMail(mailOptions, function(error, info) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         console.log(newOTP , 1010101);
        //         console.log('Email sent: ' + info.response);
        //     }
        // });
        req.session.otp=newOTP
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
        console.log('logout');
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
                console.log('No data found');
                return res.render('admin/userlist', { 
                    users: [], 
                   
                    totalPages: 0,
                    currentPage: 0
                });
            }
        } catch (err) {
            console.log('Error:', err);
            return res.status(500).render('error', { message: 'Internal Server Error' });
        }
};







const blocking=  async (req,res)=>{
        try{
            console.log(888888888);
            console.log(req.params.id);
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
            console.log(req.params.id);
            const userIdToUpdate=req.params.id
            await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: false } });
    res.redirect('/admin/userList')
        } catch (err){
            console.error(err);
        }
    
    
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

};
