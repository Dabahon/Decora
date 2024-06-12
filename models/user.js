const {Schema, model} = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

// Esquema para la clase user de la BBDD MONGODB
const userSchema = Schema({
    name: {
        type: String,
        required: true
    },
    surname: String,
    nick: {
        type: String,
        required: true
    },
    bio: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "role_user"
    },
    image: {
        type: String,
        default: "default.png"
    },
    create_at: {
        type: Date,
        default: Date.now
    }
})
userSchema.plugin(mongoosePaginate);
module.exports = model("User", userSchema, "users");