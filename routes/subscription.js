const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Subscription} = require('../models/subscription');

router.post(`/`, async (req, res) => {
    
    const subscription = new Subscription({
        _id: new mongoose.Types.ObjectId(),
        plan: req.body.plan,
        desc: req.body.desc,
        country: req.body.country,
        price: req.body.price,
    })

    await subscription.save().then(subscription => {
        res.status(200).json({
            notification: "success",
            result: subscription
        })
    }).catch(err => {
            res.status(400).json({
                response: "couldn't create subscription",
                error: err})
        })
})

router.get(`/`, async (req, res)=> {

    try{
     const subscriptions = await Subscription.find();
     
     if(!subscriptions){
        res.status(404).json('Subscriptions were not found');
     }   

     const response = {
            count: subscriptions.length,
            subscription: subscriptions.map(eachSubscription=>{
                return {
                    _id: eachSubscription.id,
                    plan: eachSubscription.plan,
                    desc: eachSubscription.desc,
                    price: eachSubscription.price,
                    request: {
                        type: 'GET',
                        Url: 'localhost:3000/api/v1/subscription'
                    }
                }
            })

        }
        res.status(200).json(response);
    }catch(error){
        console.log(error)
    }
    })

router.get(`/:id`, async (req, res) => {
const subscription = await Subscription.findById(req.params.id);

if(!subscription){
    res.status(500).json({message: 'The subscription was not found'})
}

res.status(200).send(subscription);

})


//updating category
router.put(`/:id`, async (req, res) => {
       await Subscription.findByIdAndUpdate(req.params.id, 
        {
           plan: req.body.plan,
           desc: req.body.desc,
           price: req.body.price
        }, 
        
        {new: true}
        
        ).then(subscription => {
            res.status(200).json(subscription);
        }).catch(err => {
            res.status(500).json({
                message: "Couldn't update subscription data",
                error: err
            })
        })
    }) 

//deleting message information
router.delete(`/:id`, async (req, res) => {
        const id = req.params.id;
        Subscription.findByIdAndRemove(id).then(subscription => {
        
        if(subscription){
            res.status(200).json({
                message : 'susbscription deleted successfully',
                result : subscription,
                request : {
                    type : "DELETE",
                    url : "http://localhost:3000/subscription/" + id
                }
            });
        } else {
            res.status(404).json({success: false, message: 'subscription not found'});
        }
    })
    .catch(err => {
        res.status(500).json({
            error : err
        });
    });
})


module.exports = router;
