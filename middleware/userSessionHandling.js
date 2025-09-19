const userDB = require("../models/user");

const requireUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    next();
  }
};

const requireNotUser = (req, res, next) => {
  if (req.session.user && !req.session.changePassword) {
    return res.redirect("/");
  } else if (req.session.userNew?.otp) {
    return res.redirect("/");
  } else {
    next();
  }
};

//testing-=-=-

//testing-=-=-

const isBlockedNow = async (req, res, next) => {
  try {
    if (req.session.user) {
      const { name, email, isBlocked } = req.session.user;
      const user = await userDB.findOne(
        { email: email },
        { name: 1, email: 1, isBlocked: 1 }
      );
      if (user.isBlocked == true) {
        req.session.isBlocked = true;
        req.session.user = null;
        return res.redirect("/loginpage");
      }
      if (req.session.changePassword) {
        return res.redirect("/userProfile");
      }
    }
    if (req.session.userNew) {
      const { name, email, isBlocked } = req.session.userNew;
      const user = await userDB.findOne(
        { email: email },
        { name: 1, email: 1, isBlocked: 1 }
      );
      if (user.isBlocked == true) {
        req.session.isBlocked = true;
        req.session.userNew = null;
        return res.redirect("/loginpage");
      }
      next();
    } else {
      next();
    }
  } catch (err) {
    res.redirect("/error");
  }
};

const isBlockedNow2 = async (req, res, next) => {
  try {
    if (req.session.user) {
      const { name, email, isBlocked } = req.session.user;
      const user = await userDB.findOne(
        { email: email },
        { name: 1, email: 1, isBlocked: 1 }
      );
      if (user.isBlocked == true) {
        req.session.isBlocked = true;
        req.session.user = null;
        return res.redirect("/loginpage");
      }
      if (req.session.changePassword) {
        return res.redirect("/userProfile");
      }
      next();
    } else if (req.session.userNew) {
      const { name, email, isBlocked } = req.session.userNew;
      const user = await userDB.findOne(
        { email: email },
        { name: 1, email: 1, isBlocked: 1 }
      );
      if (user.isBlocked == true) {
        req.session.isBlocked = true;
        req.session.userNew = null;
        return res.redirect("/loginpage");
      }
      next();
    } else {
      return res.redirect("/loginpage");
    }
  } catch (err) {
    res.redirect("/error");
  }
};

const otpSession = (req, res, next) => {
  if (req.session.userNew?.otp) {
    if (req.session.updatePassword) {
      return next();
    }
    return res.redirect("/");
  } else if (req.session.user) {
    next();
  } else {
    return res.redirect("/error");
  }
};

const otpSessionNewUser = (req,res,next)=>{
  if(req.session.newUser){
    return next();
  }
  if(req.session.updateOrForgotPassword){
    return next();
  }
  else{
    return res.redirect("/error");
  }
}


const resendOtpSession= (req,res,next)=>{
  req.session.resendOtp =true
  if(req.session.newUser){
    return next();
  }
  if(req.session.updateOrForgotPassword){
    return next();
  }
  else{
    console.log(1,0,8,'resend otp session error');
    
    return res.redirect("/error");
  }
}





const userlogged = (req, res, next) => {
  if (req.session.userNew || req.session.user) {
    next();
  } else {
    res.redirect("/loginPage");
  }
};

const passwordUpdation = (req, res, next) => {
  if (req.session.userNew || req.session.user) {
    res.redirect("/");
  } else {
    next();
  }
};

module.exports = {
  requireUser,
  requireNotUser,
  isBlockedNow,
  otpSession,
  userlogged,
  passwordUpdation,
  isBlockedNow2,
  otpSessionNewUser,
  resendOtpSession,
};
