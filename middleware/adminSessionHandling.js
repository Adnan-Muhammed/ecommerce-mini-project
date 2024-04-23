// adminSessionHandling.js

const requireAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/");
  }
};

const requireNotAdmin = (req, res, next) => {
  if (!req.session.admin) {
    next();
  } else {
    res.redirect("/admin/admindashboard");
  }
};

module.exports = {
  requireAdmin,
  requireNotAdmin,
};
