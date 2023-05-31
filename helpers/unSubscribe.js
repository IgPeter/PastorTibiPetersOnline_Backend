const {User} = require('../models/user');

const changeSubStatus = async (req, res, next) => {
    const user = await User.find({email: req.body.email});
    if(user){
        const sub = user[0].subscription;
        console.log(sub);
        if(Object.keys(sub) === 0){
            next()
        }else {
            let subExpiresAt
            const subscribedDate = new Date(sub.dateSubscribed)
            const currentDate = new Date(Date.now()).toISOString();
            switch (sub.plan){
                case "Basic":
                    subscribedDate.setDate(subscribedDate.getDate() + 90)
                    subExpiresAt = subscribedDate.toISOString();
                case "Standard":  
                    subscribedDate.setDate(subscribedDate.getDate() + 180)
                    subExpiresAt = subscribedDate.toISOString();
                case "Premuim": 
                    subscribedDate.setDate(subscribedDate.getDate() + 365)
                    subExpiresAt = subscribedDate.toISOString();
                default:
                    subscribedDate.setDate(subscribedDate.getDate() + 7)
                    subExpiresAt = subscribedDate.toISOString();
            }
            
            if(currentDate > subExpiresAt){
                req.body.user.isSubscribed = false;
                req.body.user.subscription = {};
                next();
            }else{
                next();
            }
        }

    }else{
        console.log('User not found')
        next();
    }

}

exports.changeSubStatus = changeSubStatus