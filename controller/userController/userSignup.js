const session=require('express-session')
const userDB = require('../../models/user');
const otpGenerator = require('otp-generator')
const productDB = require('../../models/product');
let otp
let userName
let isAlert
let isLogged








const userlogin=(req, res) => {
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
        res.render('user/user-login'); 
    }
    }



const userSignupGet=(req,res)=>{
 

    if ( !req.session.usersId ) {
        console.log(777777);
         isAlert= (req.session.userExist)?true:false
        console.log(isAlert);
        req.session.userExist = null; 

        
            res.render('user/user-register',{isAlert});

            
    }
   
}









    




   
    // Redirect after sending the email
  




// }








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
    homeWithUser,
};