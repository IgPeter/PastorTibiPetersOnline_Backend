const mongoose = require('mongoose');
const subscriptionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    plan: {type: String, required: true},
    desc: {type: String, required: true},
    country: {type: String, required: true},
    price: {type: Number}
});

subscriptionSchema.virtual('id').get(function(){
    return this._id.toHexString();
})

subscriptionSchema.set('toJSON', {
    virtuals: true
})


exports.Subscription = mongoose.model('Subscription' , subscriptionSchema)