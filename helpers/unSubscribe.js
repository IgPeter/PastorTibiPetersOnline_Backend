const {User} = require('../models/user');

const changeSubStatus = async (req, res, next) => {
        const milliSecPerDay = 24 * 60 * 60 * 1000;
        let timeDifference;
        let numOfDays;
        const user = await User.find({email: req.body.email});
        if(user){
            if(!user.subscription){
                next();
            }else {
                let sub = user[0].subscription
                let subExpiresAt
                const subscribedDate = new Date(sub.dateSubscribed)
                const currentDate = new Date(Date.now()).toISOString();
                switch (sub.plan){
                    case "Basic":
                        subscribedDate.setDate(subscribedDate.getDate() + 90)
                        subExpiresAt = subscribedDate.toISOString();
                        timeDifference = subExpiresAt.getTime() - currentDate.getTime();
                        numOfDays = timeDifference/milliSecPerDay
                        user.subscription.numOfDays = numOfDays;
                        await user.save();
                        break
                    case "Standard":
                        subscribedDate.setDate(subscribedDate.getDate() + 180)
                        subExpiresAt = subscribedDate.toISOString();
                        timeDifference = subExpiresAt.getTime() - currentDate.getTime();
                        numOfDays = timeDifference/milliSecPerDay
                        user.subscription.numOfDays = numOfDays;
                        await user.save();
                        break
                    case "Premuim":
                        subscribedDate.setDate(subscribedDate.getDate() + 365)
                        subExpiresAt = subscribedDate.toISOString();
                        timeDifference = subExpiresAt.getTime() - currentDate.getTime();
                        numOfDays = timeDifference/milliSecPerDay
                        user.subscription.numOfDays = numOfDays;
                        await user.save();
                        break
                    default:
                        subscribedDate.setDate(subscribedDate.getDate() + 7);
                        subExpiresAt = subscribedDate.toISOString();
                        timeDifference = subExpiresAt.getTime() - currentDate.getTime();
                        numOfDays = timeDifference/milliSecPerDay
                        user.subscription.numOfDays = numOfDays;
                        await user.save();
                        console.log('I have fully updated free trial details')
                }
                   
                if(currentDate > new Date(subExpiresAt)){
                    user.isSubscribed = false;
                    user.subscription = {};
                    await user.save();
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