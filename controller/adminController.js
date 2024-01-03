require('dotenv').config();
const adminId=process.env.ADMIN_ID
const adminPassword=process.env.PASSWORD

const adminLogin=(req,res)=>{
    res.render('admin/sign-in')
}

const adminDashboardPost=(req,res)=>{
    const {admin_id,password}=req.body
     if(admin_id==adminId &&  password==adminPassword){
        req.session.admin=adminId
        res.redirect('/admin/admindashboard')
    }
    else{
        res.redirect('/admin')
    }
}

const adminDashboardGet=(req,res)=>{
    res.render('admin/admin-dashboard')
}

const adminLogout=(req, res)=>{
    req.session.admin = null;
    res.redirect('/admin');
}

module.exports={
    adminLogin,
    adminDashboardPost,
    adminDashboardGet,
    adminLogout,
}