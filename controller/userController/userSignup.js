const session=require('express-session')
const userDB = require('../../models/user');
const otpGenerator = require('otp-generator')
const productDB = require('../../models/product');
let otp
let userName
let isAlert
let isLogged







const userlogin=(req, res) => {
    console.log('login1111');
    if( req.session.error){
        req.session.error=null
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
    if(!req.session.usersId){
        console.log();
        res.render('user/user-login'); 
    }
    }



const userSignupGet=(req,res)=>{
    // console.log('user-signup');
    // res.render('user/user-register')

    if ( !req.session.usersId ) {
        console.log(777777);
         isAlert= (req.session.userExist)?true:false
        console.log(isAlert);
        req.session.userExist = null; 

        
            res.render('user/user-register',{isAlert});

            
    }
   
}







const nodemailer = require('nodemailer');
const { log } = require('util');
const userSignupPost = async (req, res) => {
    try {
        req.session.otp=null
        const { email, name, password } = req.body;
        console.log(email, name, password);
        userName=name
        const userData = await userDB.findOne({ email: email });
        if (userData) {
            req.session.userExist = userData.name;
            res.redirect('/signuppage');
        } else {
            req.session.usersId = name; // Storing the new user's data in the session
            const user = {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            };

            await userDB.insertMany([user]);
            console.log(req.session.usersId);
            console.log(9999);

             otp = otpGenerator.generate(6, {
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




            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(otp , 1010101);
                    console.log('Email sent: ' + info.response);
                }
            });
            // Redirect after sending the email
            // req.session.otp=otp
            console.log(900000000);


            res.redirect('/otpPage');
        }


        
        




    } catch (error) {
        console.error(error);
        res.send('An error occurred during signup.');
    }
};

    




   
    // Redirect after sending the email
  
    console.log(900000000);




// }



const otpPage=async (req,res)=>{
    console.log('ihbbuvuvu');
    if(!req.session.otp){
        console.log('hjjjjjjj');
        req.session.otp=true
        setTimeout(() => {
            //  delete req.session.otp;
            otp = null;
            console.log(req.session.otp);
            console.log(otp);
            // Or use req.session.unset('admin'); if you're using a library that supports it
            console.log('req.session.otp has been deleted after few seconds.');
            console.log('10 sec');
    
        }, 20000);
        res.render('user/user-otp',{otp : otp})
    }
       
    // res.send('haaaaai')
}





const otpVerificationPost = (req, res) => {
    try {
        const enteredOTP = req.body.otpform; // Assuming the input name in the form is 'otpform'
        // const storedOTP = req.session.otp;
        // console.log(storedOTP,5666);
        // console.log(req.session.otp,888);
        console.log(191919191);
        if(otp==null){
        //   return  res.render('user/user-otp', { error: 'Invalid its expired' });
        return res.send('Invalid its expired')
        }else {
            if(enteredOTP !==otp){
                // return  res.render('user/user-otp', { error: 'not correct' });
                return  res.send('not correct');
            }else{
                req.session.otp=otp
                // return res.send('success')
                return res.redirect('/')
            }
        }


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const homeWithUser=async (req,res)=>{
    try{
        // const name= await userDB.findOne({ name: userName },{"name":1});
        const userData = await userDB.findOne({ name: userName }, { name: 1, _id: 0 });
        console.log(userData.name);
        const isLogged=userData.name

        res.render('user/home',{isLogged})

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}




const home = async (req, res) => {
    try{
        const product=await productDB.find()
        if(req.session.usersId){
            console.log(req.session.usersId,1111);
          const  isLogged=req.session.usersName
            console.log(isLogged);
            req.session.Blocked=null
           return res.render('user/home',{isLogged,product}); 
        }
        if(!req.session.usersId){
            console.log('hai');
            // req.session.Blocked=null
           return res.render('user/home',product); 
        }
    }catch(err){
        console.error(err);
    }
    }



module.exports = {
    home,
    userlogin,
    userSignupGet,
    userSignupPost,
    otpPage,
    otpVerificationPost,
    homeWithUser,
};
