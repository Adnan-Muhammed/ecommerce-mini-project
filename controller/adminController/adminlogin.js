const adminId=process.env.ADMIN_ID
const adminPassword=process.env.PASSWORD


const adminlogin=(req,res)=>{
    if(!req.session.AdminsId){
    if(req.session.wrongId){
        req.session.wrongId=null
        res.render('admin/sign-in',{isAlert:true})
    }else{
        res.render('admin/sign-in')
    }
    }else{
        res.redirect('/admin/admindashboard')
    }
}

const adminlogout= (req,res)=>{
    req.session.AdminsId=null
    res.redirect('/admin/')
}




// post
const admindashboardPost=(req,res)=>{

    const {admin_id,password}=req.body
    if(admin_id==adminId &&  password==adminPassword){
        req.session.AdminsId=true
        res.redirect('/admin/admindashboard')
    }
    else{
        req.session.wrongId=true
        res.redirect('/admin')
    }
}



const admindashboardGet=(req,res)=>{
    if(req.session.AdminsId){
        res.render('admin/admin-dashboard')
    }
}





module.exports={
    adminlogin,
    admindashboardPost,
    admindashboardGet,
    adminlogout,
}