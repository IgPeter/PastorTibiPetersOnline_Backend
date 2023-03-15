const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Message} = require('../models/message');
const multer = require('multer');

//Getting the mimetype
const FILE_TYPE = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'audio/mp4': 'mp4 audio',
    'audio/mpeg': 'mp3',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/3gp': '3gp',
    'application/pdf': 'pdf',
}


const storage = multer.diskStorage({
    destination: function (req, file, cb){
        const isValid = FILE_TYPE[file.mimetype];
        let uploadError = new Error('Invalid file type')
        
        if(isValid){
            uploadError = null;
        }

        if(FILE_TYPE[file.mimetype] == 'png' || 
        FILE_TYPE[file.mimetype] == 'jpeg' || FILE_TYPE[file.mimetype] == 'jpg' ){
            cb(uploadError, 'public/upload/message/images');
        }

        if(FILE_TYPE[file.mimetype] == 'mp4' || 
        FILE_TYPE[file.mimetype] == 'mpeg' || FILE_TYPE[file.mimetype] == '3pg' ){
            cb(uploadError, 'public/upload/message/videoMessage');
        }

        if(FILE_TYPE[file.mimetype] == 'mp3' || FILE_TYPE[file.mimetype] == 'mp4 audio'){
            cb(uploadError, 'public/upload/message/audioMessages');
        }

        if(FILE_TYPE[file.mimetype] == 'pdf'){
            cb(uploadError, 'public/upload/message/books');
        }
    },

    filename: function (req, file, cb){
        const fileName = file.originalname.replace(' ','-');
      const extension = FILE_TYPE[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const fileUpload = multer({storage: storage});

const cpUpload = fileUpload.fields([{ name: 'message', maxCount: 1 }, { name: 'image', maxCount: 1 }])

//Contains all the message related routes
router.post(`/`, cpUpload, async (req, res) => {
    
    const imageFilePath = `${req.protocol}://${req.get('host')}/public/upload/message/images`;
    let filePath;
    
    const image_fileName = req.files.image[0].filename;
    const message_fileName = req.files.message[0].filename;
    const msExt = FILE_TYPE[req.files.message[0].mimetype];

    if (msExt == 'mp4 audio' || msExt == 'mp3'){
         filePath = `${req.protocol}://${req.get('host')}/public/upload/message/audioMessages`
        }

    if (msExt == 'mp4' || msExt == 'mpeg' || msExt == '3gp'){
         filePath = `${req.protocol}://${req.get('host')}/public/upload/message/videoMessage`
    }

    if(msExt == 'pdf'){
         filePath = `${req.protocol}://${req.get('host')}/public/upload/message/books`
    }

    const message = new Message({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        description: req.body.description,
        contentType: req.body.contentType,
        image: `${imageFilePath}/${image_fileName}`,
        message: `${filePath}/${message_fileName}`,
        isFeatured: req.body.isFeatured
    })

    await message.save().then(message => {
        res.status(200).json({
            notification: "message was created successfully",
            result: message
        })
    }).catch(err => {
            res.status(400).json({
                response: "couldn't create message",
                error: err})
        })
})

router.get(`/`, async (req, res)=> {

    let filter = {}

    if(req.query.contentType){
        filter = {contentType: req.query.contentType}
    }

     await Message.find(filter).then(result=>{
        const response = {
            count: result.length,
            message: result.map(eachMessage=>{
                return {
                    _id: eachMessage.id,
                    title: eachMessage.title,
                    description: eachMessage.description,
                    dateCreated: eachMessage.dateCreated,
                    contentType: eachMessage.contentType,
                    id: eachMessage.id,
                    request: {
                        type: 'GET',
                        Url: 'localhost:3000/api/v1/message'
                    }
                }
            })

        }
        res.status(200).json(response);
    }).catch(err=>{
        res.status(500).json({
            response: 'Failed',
            error: err
        })
    })
})

//getting all featured messages
router.get(`/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredMessage = await Message.find({isFeatured: true}).limit(+count)

    if(!featuredMessage){
        res.status(500).json("Failed operation")
    }
    
    res.status(200).json( featuredMessage);
})

//updating message information
router.put(`/:id`, async (req, res) => {
    Message.findByIdAndUpdate(req.params.id, 
    {
        title: req.body.title,
        description: req.body.description,
        contentType: req.body.contentType,
        image: req.body.image,
        file: req.body.file
    }, 
    
    {new: true}
    
    ).then(updatedMessage => {
        const response = {
            title: updatedMessage.title,
            description: updatedMessage.description,
            contentType: updatedMessage.contentType,
            image: updatedMessage.image,
            file: updatedMessage.file
        }

        res.status(200).json(response);
    }).catch(err => {
        res.status(500).json({
            message: "Couldn't update message",
            error: err
        })
    })
})

//deleting message information
router.delete(`/:id`, async (req, res) => {
        const id = req.params.id;
        Message.deleteOne({_id : id}).then(deletedMessage => {
        res.status(200).json({
            message : 'message deleted successfully',
            result : deletedMessage,
            request : {
                type : "DELETE",
                url : "http://localhost:3000/message/" + id
            }
        });
    })
    .catch(err => {
        res.status(500).json({
            error : err
        });
    });
})


module.exports = router;