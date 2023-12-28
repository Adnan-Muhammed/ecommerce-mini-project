const session = require('express-session');
const userDB = require('../../models/user');







const userlist = async (req, res) => {
    if(req.session.AdminsId){
        try {

            
            
            const users = await userDB.find();
            
            if (users.length > 0) {
                const updated = req.session.updated;
                req.session.updated = null;
    
                const created = req.session.useradded;
                req.session.useradded = null;
    
                const deleted = req.session.deleted;
                req.session.deleted = null
    
    
    
    
                return res.render('admin/userlist', { users, updated, created, deleted });
            } else {
                console.log('No data found');
                return res.render('admin/userlist', { users: [], updated: null, created: null, deleted: null });
            }
        } catch (err) {
            console.log('Error:', err);
            return res.status(500).render('error', { message: 'Internal Server Error' });
        }
    }
    
};

const blocking=  async (req,res)=>{
    if(req.session.AdminsId){
        try{
            console.log(req.params.id);
            const userIdToUpdate=req.params.id
            const userName=await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            const updatedUser = await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: true } });
            req.session.Blocked=true
    res.redirect('/admin/userList')
        } catch (err){
    console.error(err);
        }
    }
}

const unblocking=  async (req,res)=>{
    if(req.session.AdminsId){
        try{
            console.log(req.params.id);
            const userIdToUpdate=req.params.id
            const userName=await userDB.find({_id:userIdToUpdate},{name:1,_id:0})
            const updatedUser = await userDB.updateOne({ _id: userIdToUpdate }, { $set: { isBlocked: false } });
            req.session.Blocked=null
    console.log(updatedUser);
    res.redirect('/admin/userList')
        } catch (err){

        }
            console.log(req.params.id);
    }
    
}



module.exports = {
    userlist,
    blocking,
    unblocking,
    // isUserBlocked,
};
