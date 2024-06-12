// Modelo
const Publication = require("../models/publication");
const fs = require("fs");
const path = require('path');
const followService = require("../services/followService");

// Acciones de prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controlles/publication.js"
    })
};

// Guardar publicacion
const save = async (req, res) => {
    try {
        // Recoger datos del body
        const params = req.body;

        // Si no llegan dar respuesta negativa
        if (!params.text) {
            return res.status(400).send({ status: "error", message: "Debes enviar el texto" });
        }

        // Crear el objeto del modelo
        let newPublication = new Publication(params);
        newPublication.user = req.user.id;

        // Guardar objeto en BBDD
        const publicationStored = await newPublication.save();

        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        });
    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "No se ha guardado la publicación",
            error: error.message
        });
    }
};

// Sacar una publicacion
const detail = async (req, res) => {
    try {
        // Sacar id de publicación de la url
        const publicationId = req.params.id;

        // Find con la condición del id
        const publicationStored = await Publication.findById(publicationId);

        if (!publicationStored) {
            return res.status(404).send({ status: "error", message: "No existe la publicación" });
        }

        return res.status(200).send({
            status: "success",
            message: "Mostrar publicación",
            publication: publicationStored
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al buscar la publicación",
            error: error.message
        });
    }
};

// Eliminar publicaciones
const remove = async (req, res) => {
    try {
        // Sacar el id de la publicacion a eliminar
        const publicationId = req.params.id;

        // Find y luego remove
        const result = await Publication.deleteOne({ user: req.user.id, _id: publicationId });

        if (result.deletedCount === 0) {
            return res.status(404).send({ status: "error", message: "No se ha podido eliminar la publicación" });
        }

        return res.status(200).send({
            status: "success",
            message: "Publicación eliminada",
            publication: publicationId
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al eliminar la publicación",
            error: error.message
        });
    }
};

// Listar todas las publicaciones (FEED);
const feed = async (req, res) => {
    // Sacar la pagina actual
    let page = 1;
    if (req.params.page) {
        page = parseInt(req.params.page, 10); // Asegurarse de que page sea un número
    }

    // Establecer el numero de elementos por pagina
    const itemsPerPage = 5;

    try {
        // Obtener el array de id de los usuarios que sigo
        const myFollows = await followService.followUserIds(req.user.id);

        // Opciones de paginación
        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { created_at: -1 },
            populate: { path: 'user', select: '-password -role -__v -email' }
        };

        // Encontrar las publicaciones de los usuarios que sigo y paginar los resultados
        const result = await Publication.paginate({ user: { $in: myFollows.following } }, options);

        return res.status(200).send({
            status: "success",
            message: "Feed de publicaciones",
            myFollows: myFollows.following,
            total: result.totalDocs,
            page: result.page,
            pages: result.totalPages,
            publications: result.docs
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se han listado las publicaciones del feed"
        });
    }
};


// Listar publicaciones de un usuario
const user = async (req, res) => {
    try {
        // Sacar el id del usuario
        const userId = req.params.id;

        // Controlar la pagina
        let page = 1;
        if (req.params.page) {
            page = req.params.page;
        }

        const itemsPerPage = 5;

        // Find, populate, ordenar, paginar
        const options = {
            page,
            limit: itemsPerPage,
            sort: { created_at: -1 },
            populate: { path: 'user', select: '-password -__v -role -email' }
        };

        const result = await Publication.paginate({ user: userId }, options);

        if (!result.docs.length) {
            return res.status(404).send({ status: "error", message: "No hay publicaciones para mostrar" });
        }

        return res.status(200).send({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
            page: result.page,
            total: result.totalDocs,
            pages: result.totalPages,
            publications: result.docs
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al buscar las publicaciones",
            error: error.message
        });
    }
};



// Subir ficheros
const upload = async (req, res) => {
    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "La petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo y la extensión
    let image = req.file.originalname;
    const extension = image.split('.').pop(); // Mejorado para tomar la última parte tras el último punto

    // Comprobar la extensión del archivo
    if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        // Borrar el archivo subido si la extensión es incorrecta
        fs.unlink(req.file.path, err => {
            if (err) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al borrar el archivo no soportado",
                    error: err
                });
            }
            return res.status(400).send({
                status: "error",
                message: "Extensión del fichero invalida"
            });
        });
    } else {
        try {

            // Sacar publication ID
            const publicationId = req.params.id;

            // Si la extensión es correcta, guardar en BBDD
            const publicationUpdated = await Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }).exec();

            if (!publicationUpdated) {
                return res.status(500).send({
                    status: "error",
                    message: "Error en la subida de la publicaión"
                });
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                publication: publicationUpdated,
                file: req.file
            });

        } catch (error) {
            return res.status(500).send({
                status: "error",
                message: "Error al actualizar el usuario",
                error: error.message
            });
        }
    }
}

// Devolver archivos multimedia
const media = (req, res) => {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar un path
    const filePath = "./uploads/publications/" + file;

    // Comprobar que existe el archivo
    fs.stat(filePath, (error, exist) => {
        if (!exist) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        // Devolver el archivo si existe
        return res.sendFile(path.resolve(filePath));
    });
};

const like = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.id;

        // Comprobar si el usuario ya ha dado me gusta
        const publication = await Publication.findById(publicationId);

        if (publication.likedBy.includes(userId)) {
            return res.status(400).send({ status: "error", message: "Ya has dado me gusta a esta publicación" });
        }

        // Incrementar el contador de likes y añadir el ID del usuario
        publication.likes += 1;
        publication.likedBy.push(userId);

        await publication.save();

        return res.status(200).send({
            status: "success",
            message: "Me gusta agregado",
            publication
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al dar me gusta",
            error: error.message
        });
    }
};

const unlike = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.id;

        // Comprobar si el usuario ha dado me gusta
        const publication = await Publication.findById(publicationId);

        if (!publication.likedBy.includes(userId)) {
            return res.status(400).send({ status: "error", message: "No has dado me gusta a esta publicación" });
        }

        // Decrementar el contador de likes y quitar el ID del usuario
        publication.likes -= 1;
        publication.likedBy.pull(userId);

        await publication.save();

        return res.status(200).send({
            status: "success",
            message: "Me gusta removido",
            publication
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al remover me gusta",
            error: error.message
        });
    }
};

// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed,
    like,
    unlike
}