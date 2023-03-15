const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true},
    description: String,
    contentType: String,
    image: String,
    message: String,
    isFeatured: {
        type: Boolean,
        default: false
    },
    dateCreated: {type: Date, default: Date.now}
});

messageSchema.virtual('id').get(function(){
    return this._id.toHexString();
})

messageSchema.set('toJSON', {
    virtuals: true
})

exports.Message = mongoose.model('Message', messageSchema);