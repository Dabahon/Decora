// Importar Modulos
const jwt = require("jwt-simple");
const moment = require("moment");

// Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// Middleware de autenticación
exports.auth = (req, res, next) => {

    // Comprobar si me llega la cabecera de autentificación
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "Error",
            message: "La petición no tiene la cabecera de autentificación"
        });
    }

    // Limpiar Token
    let token = req.headers.authorization.replace(/['"]+/g, '');

    // Decodificar Token
    try {
        let payload = jwt.decode(token, secret);

        // Comprobar expiración del token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "Error",
                message: "Token expirado"
            });
        }

        // Agregar datos de usuario a request
        req.user = payload;

        // Pasar a ejecucion de acción
        next()

    } catch (error) {
        return res.status(404).send({
            status: "Error",
            message: "Token invalido",
            error
        });
    }
}
