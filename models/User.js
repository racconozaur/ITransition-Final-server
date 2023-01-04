const {Schema, model, ObjectId} = require("mongoose")


const User = new Schema({
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true },
    date: {type: String},
    status: {type: String},
    role: {type: String}

})

module.exports = model('User', User)
