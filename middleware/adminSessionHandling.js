// adminSessionHandling.js

const requireAdmin = (req, res, next) => {
  if (req.session.admin) {
    console.log("Admin session found");
    console.log(7777);
    next();
  } else {
    res.redirect("/admin/");
  }
};


const requireNotAdmin = (req, res, next) => {
  if (!req.session.admin) {
    console.log("No admin session found");
    next();
  } else {
    res.redirect("/admin/admindashboard");
  }
  
};

module.exports = {
  requireAdmin,
  requireNotAdmin,
};
