// Importar modelo
const Follow = require("../models/follow");
const User = require("../models/user")

// importar servicio
const followService = require("../services/followService")


// Acciones de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controlles/follow.js"
    })
}

// Acción de guardar un follow (acción de seguir)
const save = async (req, res) => {
    // Conseguir datos por body
    const params = req.body;

    // Sacar id del usuario identificado
    const identity = req.user;

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    });

    try {
        // Comprobar si ya existe el seguimiento
        const existingFollow = await Follow.findOne({
            user: identity.id,
            followed: params.followed
        });

        if (existingFollow) {
            return res.status(409).send({
                status: "error",
                message: "Ya sigues a este usuario"
            });
        }

        // Guardar objeto en BBDD si no existe ya un seguimiento
        const followStored = await userToFollow.save();

        // Devolver respuesta exitosa con el objeto guardado
        res.status(200).send({
            status: "success",
            identity: req.user,
            follow: followStored
        });
    } catch (error) {
        // Manejar error al guardar o consultar
        res.status(500).send({
            status: "error",
            message: "No se ha podido seguir al usuario",
            error: error.message
        });
    }
};


// Acción de dejar de seguir
const unfollow = async (req, res) => {
    try {
        // Recoger el ID del usuario identificado
        const userId = req.user.id;

        // Recoger el id del usuario que sigo y quiero dejar de seguir
        const followedId = req.params.id;

        // find de las coincidencias y hacer deleteOne
        const followDeleted = await Follow.deleteOne({
            "user": userId,
            "followed": followedId
        });

        if (followDeleted.deletedCount === 0) {
            return res.status(404).send({
                status: "error",
                message: "No seguías a este usuario"
            });
        }

        res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente",
            identity: req.user,
            followDeleted
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: "No has dejado de seguir a ningún usuario"
        });
    }
};

const following = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        let userId = req.user.id;

        // Comprobar si me llega el id por parámetro en URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página, si no, la página es 1
        let page = 1;
        if (req.params.page) {
            // Asegurar que el parámetro de página sea un número entero válido
            page = parseInt(req.params.page, 10);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
        }

        // Cuántos usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Configurar las opciones de paginación y población de datos
        const options = {
            page: page,
            limit: itemsPerPage,
            populate: { path: 'followed', select: '-password -role -__v -email' },
            lean: true, // Añadir lean para mejorar el rendimiento
        };

        // Ejecutar la consulta de paginación
        const result = await Follow.paginate({ user: userId }, options);

        // Verificar si no se encontraron usuarios seguidos
        if (!result.docs.length) {
            return res.status(404).send({
                status: "error",
                message: "No sigues a ningún usuario"
            });
        }

        // Obtener los IDs de los usuarios que sigue y los que le siguen
        let followUserIds = await followService.followUserIds(req.user.id);

        // Responder con los datos paginados y la información adicional
        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo",
            follows: result.docs,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            itemsPerPage: result.limit,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        // Manejar errores y enviar una respuesta de error
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el listado de usuarios que estás siguiendo"
        });
    }
};

const followers = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        let userId = req.user.id;

        // Comprobar si me llega el id por parámetro en URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página, si no, la página es 1
        let page = 1;
        if (req.params.page) {
            // Asegurar que el parámetro de página sea un número entero válido
            page = parseInt(req.params.page, 10);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
        }

        // Cuántos usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Configurar las opciones de paginación y población de datos
        const options = {
            page: page,
            limit: itemsPerPage,
            populate: { path: 'user', select: '-password -role -__v -email' },
            lean: true, // Añadir lean para mejorar el rendimiento
        };

        // Ejecutar la consulta de paginación
        const result = await Follow.paginate({ followed: userId }, options);

        // Verificar si no se encontraron usuarios seguidores
        if (!result.docs.length) {
            return res.status(404).send({
                status: "error",
                message: "No tienes ningún seguidor"
            });
        }

        // Obtener los IDs de los usuarios que sigue y los que le siguen
        const followUserIds = await followService.followUserIds(req.user.id);

        // Responder con los datos paginados y la información adicional
        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me siguen",
            follows: result.docs,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            itemsPerPage: result.limit,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        // Manejar errores y enviar una respuesta de error
        console.error("Error fetching followers:", error);
        return res.status(500).send({
            status: "error",
            message: "Error en la consulta",
            error: error.message
        });
    }
};

// Acción del listado de usuarios que me siguen

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}