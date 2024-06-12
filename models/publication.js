const {Schema, model} = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const mongoose = require("mongoose");

// Esquema para la clase publication de la BBDD MONGODB
const PublicationSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        required: true
    },
    file: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    likes: { 
        type: Number, 
        default: 0 
    },
    likedBy: [{
         type: mongoose.Schema.Types.ObjectId, ref: "User" 
    }]
});
PublicationSchema.plugin(mongoosePaginate);
module.exports = model("Publication", PublicationSchema, "publications");