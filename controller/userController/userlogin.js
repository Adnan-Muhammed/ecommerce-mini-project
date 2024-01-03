const session=require('express-session')
const userDB = require('../../models/user');
const productDB=require('../../models/product')
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


// const userProductlist=(req,res)=>{
//     res.render('user/productlist')
// }


const PRODUCTS_PER_PAGE = 8;
const userProductlist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PRODUCTS_PER_PAGE;

        // Fetch products from your database here, considering your actual data retrieval method
        // For example:
        const products = await productDB.find().skip(skip).limit(PRODUCTS_PER_PAGE);

        // Calculate total product count (assuming you have a Product model)
        const totalProductsCount = await productDB.countDocuments();

        const totalPages = Math.ceil(totalProductsCount / PRODUCTS_PER_PAGE);

        res.render('user/productlist', {
            products,
            totalPages,
            currentPage: page
        });
    } catch (err) {
        console.log('Error:', err);
        return res.status(500).render('error', { message: 'Internal Server Error' });
    }
};

const userproductDetails=(req,res)=>{
    res.render('user/product-details-zoom')
}




module.exports={
    userSignIn,
    userlogout,
    isUserBlocked,
    userProductlist,
    userproductDetails
}