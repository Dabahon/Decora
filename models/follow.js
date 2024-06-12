const {Schema, model} = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

// Esquema para la clase Follow de la BBDD MONGODB
const FollowSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    followed: {
        type: Schema.ObjectId,
        ref: "User"
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

FollowSchema.plugin(mongoosePaginate);

module.exports = model("Follow", FollowSchema, "follows");