const mongoose = require("mongoose");

const connection = async() => {
    try {
        await mongoose.connect("mongodb://localhost:27017/decora");
        console.log("Conectado correctamente a bd: decora");

    } catch(error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la BBDD !!");
    }
}

module.exports = connection