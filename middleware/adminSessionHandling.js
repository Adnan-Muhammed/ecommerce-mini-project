
// adminSessionHandling.js

const requireAdmin = (req, res, next) => {
    if (req.session.admin) {
        // User is an admin
        console.log('Admin session found');
        next();
    } else {
        // Redirect unauthorized users to sign-in
        // res.render('admin/sign-in');
        res.redirect('/admin/');

    }
};

const requireNotAdmin = (req, res, next) => {
    if (!req.session.admin) {
        // User is not an admin
        console.log('No admin session found');
        next();
    } else {
        // Redirect logged-in admin to dashboard
        res.redirect('/admin/admindashboard');
    }
};

module.exports = {
    requireAdmin,
    requireNotAdmin
};
