const userDB = require('../models/user');

const requireUser = (req, res, next) => {
    if (req.session.user) {
        console.log('User session found');
        next();
    } 
    else {
        next()
    }
};

const requireNotUser = (req, res, next) => {
    if (req.session.user && !req.session.changePassword) {
      console.log(333,'its verified post')
       return  res.redirect('/');
        }else if(req.session.userNew?.otp){
        console.log(444,'its verified post')
        return res.redirect('/')
        }else {
        console.log(555,'its verified post')
        console.log('User session not found');
        next();
        }
};

//testing-=-=-






//testing-=-=-

const  isBlockedNow=async (req,res,next)=>{
    console.log('www',111);
    try{

        if(req.session.user){
            const {name,email,isBlocked}=req.session.user
            const user=await userDB.findOne({email:email},{name:1,email:1,isBlocked:1})
            if(user.isBlocked==true){
                console.log('isBlocked==true');
                req.session.isBlocked=true
                req.session.user=null
                return res.redirect('/loginpage')
            }
            console.log(1111111);
            if(req.session.changePassword){
               return res.redirect('/userProfile')
            }
        }if(req.session.userNew){
            const {name,email,isBlocked}=req.session.userNew
            const user=await userDB.findOne({email:email},{name:1,email:1,isBlocked:1})
            if(user.isBlocked==true){
                console.log('isBlocked==true');
                req.session.isBlocked=true
                req.session.userNew=null
                return res.redirect('/loginpage')
            }
            next()
        }else{
            console.log(2323);
            next()

        }
    }
    catch(err){
        console.error(err);
    }
}

const otpSession=(req,res,next)=>{
    // if(!req.session.userNew ){
    //     console.log('no user session');
    //     return res.redirect('/')
    // }
    if( req.session.userNew?.otp){
        console.log('no otp session');
       return res.redirect('/')
    }else{
        next()  
}
}



const userlogged = (req, res, next) => {
    //for cart page
console.log('userSessionHandling middleware');
    // console.log(req.session.cartId);
    console.log('is getting here also');
    if (req.session.userNew || req.session.user) {
        next();
    } else {
        res.redirect('/loginPage');
    }
}

const passwordUpdation = (req, res, next) => {
console.log(' forgot password');
    if (req.session.userNew || req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}


module.exports={
    requireUser,
    requireNotUser,
    isBlockedNow,
    otpSession,
    userlogged,
    passwordUpdation,
    
}
