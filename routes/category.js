const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Category} = require('../models/category');


router.post(`/`, async (req, res) => {
    
    const category = new Category({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        color: req.body.color
    })

    await category.save().then(category => {
        res.status(200).json({
            notification: "category was created successfully",
            result: category
        })
    }).catch(err => {
            res.status(400).json({
                response: "couldn't create category",
                error: err})
        })
})

router.get(`/`, async (req, res)=> {

     await Category.find().then(result=>{
        const response = {
            count: result.length,
            category: result.map(eachCategory=>{
                return {
                    _id: eachCategory.id,
                    name: eachCategory.name,
                    color: eachCategory.color,
                    id: eachCategory.id,
                    request: {
                        type: 'GET',
                        Url: 'localhost:3000/api/v1/category'
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

router.get(`/:id`, async (req, res) => {
const category = await Category.findById(req.params.id);

if(!category){
    res.status(500).json({message: 'The category ID was not found'})
}

res.status(200).send(category);

})


//updating category
router.put(`/:id`, async (req, res) => {
       await Category.findByIdAndUpdate(req.params.id, 
        {
           name: req.body.name,
           color: req.body.color
        }, 
        
        {new: true}
        
        ).then(category => {
            res.status(200).json(category);
        }).catch(err => {
            res.status(500).json({
                message: "Couldn't update category",
                error: err
            })
        })
    }) 

//deleting message information
router.delete(`/:id`, async (req, res) => {
        const id = req.params.id;
        Category.findByIdAndRemove(id).then(category => {
        
        if(category){
            res.status(200).json({
                message : 'category deleted successfully',
                result : category,
                request : {
                    type : "DELETE",
                    url : "http://localhost:3000/category/" + id
                }
            });
        } else {
            res.status(404).json({success: false, message: 'category not found'});
        }
    })
    .catch(err => {
        res.status(500).json({
            error : err
        });
    });
})


module.exports = router;
