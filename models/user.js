const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    email: {type: String, required: true},
    password: {type: String, required: true},
    isSubscriber: {type: Boolean, default: false},
    isAdmin: {type: Boolean, default: false},
    phone: Number,
    avatar: String
});

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
})

userSchema.set('toJSON', {
    virtuals: true
})

exports.User = mongoose.model('User', userSchema);