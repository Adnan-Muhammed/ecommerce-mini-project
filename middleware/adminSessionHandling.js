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

// const requireNotAdmin = (req, res, next) => {
//     if (!req.session.admin && (!req.session.user && !req.session.userNew) ) {
//         // User is not an admin
//         console.log('No admin session found');
//         next();
//     } else {
//         // Redirect logged-in admin to dashboard
//         res.redirect('/admin/admindashboard');
//     }
// };

const requireNotAdmin = (req, res, next) => {
  // if (!req.session.user && !req.session.userNew ) {
  if (!req.session.admin) {
    console.log("No admin session found");
    next();
  } else {
    res.redirect("/admin/admindashboard");
  }
  // }else{
  //     res.redirect('/')
  // }
};

module.exports = {
  requireAdmin,
  requireNotAdmin,
};
