const {Schema, model, ObjectId} = require("mongoose")

const Comment = new Schema({
    postId: {type: String, required: true },
    comment: {type: String},
    author: {type: String}
})

module.exports = model('Comment', Comment)