const express = require('express');
const router = express.Router();
const {User} = require('../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const {changeSubStatus} = require('../helpers/unSubscribe')


//Getting the mimetype
const fileExtension = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

//Disk storage functionality for multer file upload.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = fileExtension[file.mimetype];
        let uploadError = new Error('imageTypeError');
        if(isValid){
            uploadError = null;
        }

      cb(uploadError, 'public/upload/user/images')
    },

    filename: function (req, file, cb) {
      const fileName = file.originalname.replace(' ','-');
      const extension = fileExtension[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
  const upload = multer({ storage: storage })

//Used for all users with full user information
router.post(`/register`, upload.single('avatar'), async (req, res) => {
    const existingUser = await User.findOne({email: req.body.email});

    if(existingUser){
        return res.status(401).json('User already exist');
    }

    const fileName = req.file.filename;
    const filePath =`${req.protocol}://${req.get('host')}/public/upload/user/images`

    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        isAdmin: req.body.isAdmin,
        country: req.body.country,
        phone: req.body.phone,
        avatar: `${filePath}${fileName}` //http://localhost:3000/public/upload/filename
    })

     await user.save().then(user=>{
        const response = {
            _id : user._id,
            name: user.firstName + ' ' + user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            id: user.id,
            country: user.country,
            isSubscriber: user.isSubscriber,
            subscription: user.subscription,
            request: {
                url: 'localhost:3000/api/v1/user',
                type: 'POST'
            }
        }
      return res.status(200).json(response);
    }).catch(err=>{
        console.log(err);
        res.status(401).json({message: "User was not created", error: err})
    }) 
})

//Resgister with only email and password
router.post('/quickRegister', async (req, res)=> {
    const existingUser = await User.findOne({email: req.body.email});
    if(!existingUser){
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
    })

    await user.save().then(user => {
        const response = {
            _id: user._id,
            email: user.email,
            password: user.password,
            id: user.id,
            request: {
                type: 'POST',
                url: 'localhost:3000/api/v1/user',
                desc: 'creating user with only email and password'
            }
        }
        return res.status(200).json(response)
    }).catch(err => {
        res.status(500).json({
            error: err,
            message: "Failed operation"
        })
    })
}
res.status(401).json('User already exist');

})


//Used by the admin only
router.post(`/`, upload.single('avatar'), async (req, res) => {
    const existingUser = await User.findOne({email: req.body.email});
    if(!existingUser){

    const fileName = req.file.filename;
    const filePath =`${req.protocol}//${req.get('host')}/public/upload/user/images`

    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        isAdmin: req.body.isAdmin,
        country: req.body.country,
        phone: req.body.phone,
        avatar: `${filePath}${fileName}` //http://localhost:3000/public/upload/filename
    })

    await user.save().then(user=>{
        const response = {
            _id : user._id,
            FullName: user.firstName + ' ' + user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            dateSubscribed: user.dateSubscribed,
            id: user.id,
            request: {
                url: 'localhost:3000/api/v1/user',
                type: 'POST'
            }
        }
        res.status(200).json(response);
    }).catch(err=>{
        res.send('user was not created')
        console.log(err);s
    })
}
res.status(401).json('This admin already exist')

})


//Login
router.post(`/login`, changeSubStatus, async (req, res)=> {

    const secret = process.env.SECRET_KEY;
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return res.status(404).json('The user was not found');
    }
            
    if(user && bcrypt.compareSync(req.body.password, user.password)){
        const token = jwt.sign({
                userId: user.id,
                isAdmin: user.isAdmin,
                isSubscriber: user.isSubscriber
            }, secret , {expiresIn: '1d'})
                
            res.status(200).json({
                    user: user,
                    token: token
                });    
    }else{
        res.status(401).json('password is wrong');
    }      
  })

//GET all users
router.get(`/`, async (req, res) => {
    await User.find().then(user=>{
        const response = {
            count: user.length,
            request: {
                type: 'GET',
                url: 'localhost:3000/api/v1/user'
            },
            users: user.map(singleUser => {
                return {
                    _id: singleUser._id,
                    name: singleUser.firstName + ' ' + singleUser.lastName,
                    email: singleUser.email,
                    phone: singleUser.phone,
                    image: singleUser.image,
                    avatar: singleUser.avatar,
                    country: singleUser.country,
                    isSubscriber: singleUser.isSubscriber,
                    subscription: singleUser.subscription,
                    id: user.id                  
                }
            })
        }
        res.status(200).json(response);
    }).catch(err=>{
        res.status(404).json({
            message: "users were not found",
            error: err
    })
    });
});

router.get(`/:id`, async (req, res) => {

    await User.findById(req.params.id).select('-password').then(user => {
        const response ={
            name: user.firstName + ' ' + user.lastName,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar,
            id : user.id,
            isSubscriber: user.isSubscriber,
            subscription: user.subscription,
            country: user.country,
            request: {
                type: "GET",
                url: "localhost:3000/api/v1/" + user._id
            }
        }
        res.status(200).json(response);
    }).catch(err=>{
        res.status(404).json({
            message: "unsuccessful",
            error: err
        })
    })

})

//Getting billers public keys
router.get(`/biller/paystack`, (req, res)=> {
    const paystackPublicKeys = process.env.PAYSTACK_PUBLIC_KEY
    const paystackSecretKeys = process.env.PAYSTACK_SECRET_KEY

    res.json({
        paystackPublicKey: paystackPublicKeys
    })
})

router.patch(`/:id`, upload.single('avatar'), async (req, res) => {
    const user_id = req.params.id;

    const fileName = req.file.filename;
    const filePath =`${req.protocol}://${req.get('host')}/public/upload/user/images`

    req.body.avatar = `${filePath}${fileName}`

    await User.updateMany({_id : user_id}, {$set: req.body})
    .then(updatedUser => {

        res.status(200).json({
            result: updatedUser
        })
    })
    .catch(err=> {
        res.status(500).json({
            error : err
        })
    })  
})

//Subscribe a user
router.patch(`/subscribe/:id`, async (req, res) => {
    const user_id = req.params.id;
    const secret = process.env.SECRET_KEY;

    const {subscription} = req.body;

   try{
    const updatedUser = await User.findByIdAndUpdate(user_id, 
        {
            isSubscriber: true,
            subscription: subscription
        }, 
        {lean: true, returnDocument: 'after'})

    if(!updatedUser){
        res.status(404).json('User not found')
    }
    
    const token = jwt.sign({
        userId: updatedUser.id,
        isAdmin: updatedUser.isAdmin,
        isSubscriber: updatedUser.isSubscriber
    }, secret , {expiresIn: '1d'})
    
    res.status(200).json({
        message: 'User data updated successfully',
        updatedUser:{
            name: updatedUser.firstName + " " + updatedUser.lastName,
            token: token,
            email: updatedUser.email,
            avatar: updatedUser.avatar
           } 
        })
}catch(error){
    console.log(error);
}
})

//setting the free trial
router.patch(`/freeTrial/:id`, async (req, res) => {
    const user_id = req.params.id;
    const secret = process.env.SECRET_KEY;

    const {freeTrial} = req.body;

   try{
    const updatedUser = await User.findByIdAndUpdate(user_id, 
        {
            isSubscriber: true,
            subscription: freeTrial
        }, 
        {lean: true, returnDocument: 'after'})

    if(!updatedUser){
        res.status(404).json('User not found')
    }
    
    const token = jwt.sign({
        userId: updatedUser.id,
        isAdmin: updatedUser.isAdmin,
        isSubscriber: updatedUser.isSubscriber
    }, secret , {expiresIn: '1d'})
    
    res.status(200).json({
        message: 'User data updated successfully',
        updatedUser:{
            name: updatedUser.firstName + " " + updatedUser.lastName,
            token: token,
            email: updatedUser.email,
            avatar: updatedUser.avatar
           } 
        })
}catch(error){
    console.log(error);
}
})

router.delete(`/:id`, async (req, res) => {
    await User.findByIdAndDelete(req.params.id).then(deletedUser => {
        res.status(200).json({
            message: "Successfull operation",
            result: deletedUser
        })

    }).catch(err => {
        res.status(500).json({
            message: "Failed operation",
            error: err
        })
    })
})

module.exports = router;