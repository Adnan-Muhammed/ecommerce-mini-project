require('dotenv').config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;


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
 console.log('login post here');

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

    const  referralCode = (req.body.referralCode)??null

    console.log(req.body);
    console.log('----___----____----___');


    // return
    if (referralCode) {
        console.log("Referral Code:", referralCode);
    
       
        // const referredUser = await userDB.findOne(
        //     { refferal: referralCode }, // Corrected field name
        //     // { $inc: { wallet: 100 } }
        // );

        const referredUser = await userDB.findOneAndUpdate(
            { referral: referralCode }, // Corrected field name
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









    
        console.log("Referred User:", referredUser);
    }

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







// const otpPage = async (req, res) => {
//  console.log('otppage',77777);
//     const email = (req.session.user) ? req.session.user.email : req.session.userNew.email;
//     console.log(email,"uuu");
//     const otp= await userDB.findOne({ email: email },{otp:1,_id:0});
//  console.log(otp);
//     // req.session.userNew=otp
//  // console.log(req.session.userNew.email);
//     if (otp) {
//         console.log(otp ,"iiii");
//         setTimeout(async() => {
//             // delete req.session.otp;
//             // console.log('req.session.otp has been deleted after a few seconds.');
//             await userDB.updateOne({ email: email }, { $set: { otp: null } });
//             const otpNow=await userDB.findOne({ email: email }, { otp:1,_id:0 });
//          console.log(otpNow,1111);
//         }, 30000);

//         console.log('yes',9090909876);
//         res.render('user/user-otp', { otp: otp }); // Pass otp variable to the template
//     } else {
//         res.send('No OTP found');
//     }
// };


// const otpPage = async (req, res) => {
//     try {
//         const email = (req.session.user) ? req.session.user.email : req.session.userNew.email;
//         console.log('Email:', email);

//         const otp = await userDB.findOne({ email }, { otp: 1, _id: 0 });
//         console.log('OTP:', otp);

//         if (otp) {
//             console.log('OTP found:', otp);
//             setTimeout(async () => {
//                 await userDB.updateOne({ email }, { $set: { otp: null } });
//                 console.log('OTP deleted after timeout.');
//             }, 30000);

//             res.render('user/user-otp',{otp});
//         } else {
//             console.log('No OTP found');
//             res.send('No OTP found');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Internal server error');
//     }
// };


const otpPage = async (req, res) => {
    try {
        const email = (req.session.user) ? req.session.user.email : (req.session.newUser) ? req.session.newUser.email : req.session.email;
        // req.session.user={email:req.session.email}
        console.log('Email:', email);
        const isOtp = await userDB.findOne({ email }, { otp: 1, _id: 0 });
        console.log(isOtp.otp,'jjj');
        if(!isOtp.otp){
            console.log('ttt');
            const otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            console.log('OTP:', otp);
            await userDB.findOneAndUpdate(
                { email: email }, 
                { $set: { otp: otp } }, 
                // { upsert: true } // Options: if no document matches the query, create a new one
            );
        }
        if (isOtp) {
            console.log('OTP found:', isOtp);
            setTimeout(async () => {
                await userDB.updateOne({ email }, { $set: { otp: null } });
                console.log('OTP deleted after timeout.');
            }, 30000);
            console.log('whats happening');
            res.render('user/user-otp', { otp:isOtp });
        } else {
            console.log('No OTP found');
            res.send('No OTP found');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    }
};







//otpverificationPost


const otpVerificationPost = async (req, res) => {
    try {
        console.log('welcome gvuvu',78787);  //done
        // const email = (req.session.newUser)?req.session.newUser.email:req.session.user.email // Retrieve OTP from session
        const email = (req.session.user) ? req.session.user.email : (req.session.newUser) ? req.session.newUser.email : req.session.email;

        // const email = req.session.userNew.email ?? req.session.user.email; //  nullish coalescing operator (??) 
        console.log(email);
        const otpValue = await userDB.findOne({ email: email }, { otp: 1, _id: 0 });
        const otp = otpValue.otp;
        console.log('its otp ',otp);
        const enteredOTP = req.body.otp; // Assuming the input name in the form is 'otpform'
            if (enteredOTP != otp) {
                return res.status(400).json({ error: 'Incorrect OTP', otp: otp });
            } else {


                if (req.session.newUser) req.session.newUser.otp = otp;
                req.session.userNew = req.session.newUser??null
                req.session.user && (req.session.user.otp = otp); //nullish coalesing
                console.log(req.session.newUser?.otp,444);
                // const email = req.session.email
                console.log(email);
                const name =await userDB.find({email:email},{name:1,_id:0})
                const generatedReferralCode = otpGenerator.generate(6, { alphabets: true, upperCase: false, specialChars: false, digits: true });
                console.log(generatedReferralCode);
                const referralCode = await userDB.findOneAndUpdate({email:email}, { $set: { referral: generatedReferralCode } });

                console.log(78787);
                console.log(name);
                const username=name[0].name
                req.session.user={
                    name:username,
                    email:email
                }
                
                return res.status(200).json({ success: true });
            }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};







const updatePasswordPost = async (req, res) => {
    try {
        const { email, password } = req.body;
        req.session.email=email
        console.log('1111111',11111);
        // Find the user by email
        const user = await userDB.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (req.session.user && req.session.user.email !== user.email) {
            return res.status(404).json({ message: 'your email is not correct' });
        }
        // Hash the new password
        console.log('22222',2222);
        console.log(password); // undefined why
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('33333',3333);
        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log('444444', 4444);
        console.log(otp);
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
        // transporter.sendMail(mailOptions, function (error, info) {
        //     if (error) {
        //         console.error('Error sending email:', error);
        //         return res.status(500).json({ message: 'Failed to send OTP via email.' });
        //     } else {
        //         console.log('Email sent:', info.response);
        //         // res.redirect('/otpPage'); // Redirect to the OTP verification page
        //     }
        // });
        console.log(999,90909);
                res.redirect('/otpPage'); // Redirect to the OTP verification page
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
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



    const isPasswordChanged=(req.session.changePassword)??null
    req.session.changePassword =null
       try{
        const user = await userDB.findOne({email:emailId})

        console.log(1234321);
       console.log(user);

    
        res.render('user/profile2',{isLogged,user,isPasswordChanged})

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
        const userIdJson = user._id
        // console.log(user.id);
        const userId=userIdJson.toString()
        console.log(userId);
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
    //    console.log(orderList);


        res.render('user/orderStatus',{isLogged,orderList})
    }catch(err){
    }
}






const updatePassword = async (req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const emailId = req.session.user ? req.session.user.email : req.session.userNew? req.session.userNew.email:null

    console.log(8888);
    try{
        res.render('user/updatePassword',{isLogged})
    }catch(err){

    }

}


const forgotPassword = (req,res)=>{
    res.render('user/forgotPassword')
}


const wallet = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try{

        const user =await userDB.findOne({email:emailId})

        console.log('12345',4567);

        console.log(user)
        console.log(user.wallet)

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

    }

}

const changeName = async(req,res)=>{
    const isLogged = determineIsLogged(req.session);
    const { primaryCategories, otherCategories } = await fetchCategoryMiddleware.fetchCategories();
    const emailId = (req.session.user) ? req.session.user.email : req.session.userNew.email;
    try{

        const user =await userDB.findOne({email:emailId})

        console.log('hello cahnge m=name');
        user.name = req.body.newName;
        await user.save();


        if( req.session.user){
            req.session.user.name=user.name
        }else if(req.session.userNew){
            req.session.userNew.name=user.name
        }

        
        

        console.log(user)
        res.status(200).json({ message: 'Name updated successfully', newName: user.name });

        // res.render('user/changeName',{isLogged ,user})

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


        console.log('__=__==__=--+__');
        console.log(index);
        console.log('__=__==__=--+__')

        if (index === -1) {
            throw new Error("Billing details not found");
        }

        console.log(updatedAddress);
        user.billingDetails[index] = updatedAddress

        await user.save();

        res.status(200).json({ message: "Billing address updated successfully" });
    } catch (err) {
        console.error("Error updating billing address:", err);
        res.status(500).json({ error: err.message });
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
    // resendOtp,
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
