const {Schema, model, ObjectId} = require("mongoose")

const Message = new Schema({
    sender: {type: String, required: true },
    senderid:{type: String, required: true},
    title: {type: String},
    content: {type: String},
    rate: {type: Number},
    category: {type: String},
    hashtags: {type: String},
    image: {type: String},
    likes: { type: Array, default: [] }
})

module.exports = model('Message', Message)