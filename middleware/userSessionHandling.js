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
    if (req.session.user) {
       return  res.redirect('/');
        }else if(req.session.userNew?.otp){
        return res.redirect('/')
        }else {
        console.log('User session not found');
        next();
        }
};

//testing-=-=-
const isBlockedNow=async(req,res,next)=>{
    try{
        if(req.session.user){
            console.log('sessionAAA');
            const {name,email,isBlocked}=req.session.user
            const user=await userDB.findOne({email:email},{name:1,email:1,isBlocked:1})
            console.log(user.isBlocked);
            if(user.isBlocked==true){
                console.log('isBlocked==true');
                req.session.isBlocked=true
                req.session.user=null
                return res.redirect('/loginpage')
            }
            next()
        }else{
            req.session.user=null
            console.log('sessionNot');
            next()
        }
    } catch(err){
    }
}
//testing-=-=-












module.exports={
    requireUser,
    requireNotUser,
    isBlockedNow,
}
