const adminId="adnan@gmail.com";
const adminPassword="adnan1234"


const adminlogin=(req,res)=>{
    if(!req.session.AdminsId){
        console.log(100000);
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
        console.log(4444444);
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