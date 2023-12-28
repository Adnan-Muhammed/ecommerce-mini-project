const session=require('express-session')
const userDB = require('../../models/user');
// let user
const   userSignIn=  async (req,res)=>{
    try{
        const {email_Id,password}=req.body

        const user=await userDB.findOne({email:email_Id},{name:1,email:1,password:1,isBlocked:1})
        const isAdminBlockedUser=(user.isBlocked==true)?true:false

console.log(isAdminBlockedUser,true,false);
        if(isAdminBlockedUser==false){
            if(user.password==password){
                req.session.usersId=user.email
                req.session.userName=user.name
                console.log('welcome to home');
                // res.render('user/home',{isLogged:user.name})
        res.redirect('/')
            }
                if(user.password!=password){
                const iserror="yes"
                req.session.error= iserror//true
                res.redirect('/loginpage')
                }
        }else{
            req.session.Blocked=email_Id
            res.redirect('/loginpage')
        }

    }




    catch{
        console.log('invalid  no user');
        const isvalid="no"
        req.session.invalid=isvalid//true
        console.log(1111);
        res.redirect('/loginpage')
    }
}





const isUserBlocked = async (req, res, next) => {
    console.log(99999);
        try {
            // const email = req.session.Blocked
            const email=req.session.usersId
            console.log(email);//undefined
                const check = await userDB.findOne({ email: email })
                if (check.isBlocked == false) {
                    next()
                }
                else {
                    console.log("yes");
                    res.redirect('/logout')
                }
        }
        catch {
            console.log(10000);

            next()
        }
    }
    




const userlogout=(req,res)=>{
    req.session.usersId=null
    res.redirect('/')
}

module.exports={
    userSignIn,
    userlogout,
    isUserBlocked,
}