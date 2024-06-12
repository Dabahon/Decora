const validator = require("validator");

// Para validaciones en la back
const validate = (params) => {
    let name = !validator.isEmpty(params.name) &&
        validator.isLength(params.name, { min: 3 }) &&
        validator.isAlpha(params.name, "es-ES");

    let surname = !validator.isEmpty(params.surname) &&
        validator.isLength(params.surname, { min: 3 }) &&
        validator.isAlpha(params.surname, "es-ES");

    let nick = !validator.isEmpty(params.nick) &&
        validator.isLength(params.nick, { min: 3 });

    let email = !validator.isEmpty(params.email) &&
        validator.isLength(params.email, { min: 3 }) &&
        validator.isEmail(params.email);

    let password = !validator.isEmpty(params.password);

    if (params.bio) {
        let bio = validator.isLength(params.bio, { max: 255 });
        if (!bio) {
            throw new Error("No se ha superado la validación de bio");
        } else {
            console.log("Validación de bio superada");
        }
    }

    if (!name || !surname || !nick || !email || !password) {
        throw new Error("No se ha superado la validación");
    } else {
        console.log("Validación superada");
    }
}

module.exports = validate;
