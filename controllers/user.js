// Importar dependencias y módulos
const User = require("../models/user");
const Publication = require("../models/publication");
const Follow = require("../models/follow");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const fs = require("fs");
const path = require('path');
const validate = require("../helpers/validate")



// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    });
};

// Registro de usuarios
const register = async (req, res) => {
    // Recoger datos de la petición
    const params = req.body;

    // Comprobar que llegan todos los datos necesarios (+Validación)
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    // Validacion
    try {
        validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Fallo en la validación de los datos"
        });
    }


    // Crear objeto de usuario
    let userToSave = new User(params);

    try {
        // Control de usuarios duplicados
        const users = await User.find({
            $or: [
                { email: userToSave.email.toLowerCase() },
                { nick: userToSave.nick.toLowerCase() }
            ]
        });

        if (users.length >= 1) {
            return res.status(409).send({
                status: "error",
                message: "El usuario ya existe"
            });
        }

        // Cifrar contraseña
        const hashedPwd = await bcrypt.hash(userToSave.password, 10);
        userToSave.password = hashedPwd;

        // Guardar usuario
        await userToSave.save();

        // Devolver resultado
        res.status(201).json({
            status: "success",
            message: "Usuario registrado correctamente",
            user: userToSave
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al registrar el usuario",
            error: error.message
        });
    }
};

const login = async (req, res) => {
    // Recoger params del body
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "Error",
            message: "Faltan datos por enviar"
        });
    }

    try {
        // Buscar en la base de datos si existe el usuario
        const user = await User.findOne({ email: params.email }).exec();

        if (!user) {
            return res.status(404).send({
                status: "Error",
                message: "No existe el usuario"
            });
        }

        // Comprobar su contraseña
        const pwd = await bcrypt.compare(params.password, user.password);

        if (!pwd) {
            return res.status(400).send({
                status: "Error",
                message: "No te has identificado correctamente"
            });
        }

        // Devolver Token 
        const token = jwt.createToken(user);

        // Devolver datos del usuario
        return res.status(200).send({
            status: "success",
            message: "Te has identificado correctamente",
            user: {
                id: user._id,
                name: user.name,
                nick: user.nick
            },
            token
        });

    } catch (error) {
        return res.status(500).send({
            status: "Error",
            message: "Error en la autenticación del usuario",
            error: error.message
        });
    }
};

const profile = async (req, res) => {
    // Recibir el parámetro del id del usuario por URL
    const id = req.params.id;

    try {
        // Consulta para sacar los datos del usuario utilizando async/await sin password ni role
        const userProfile = await User.findById(id).select("-password -role").exec();

        // Comprobar si se encontró el usuario
        if (!userProfile) {
            return res.status(404).send({
                status: "Error",
                message: "El usuario no existe",
            });
        }
        // Info de seguimiento 
        const followInfo = await followService.followThisUser(req.user.id, id);

        // Devolver resultado
        return res.status(200).send({
            status: "success",
            user: userProfile,
            following: followInfo.following,
            follower: followInfo.follower
        });
    } catch (error) {
        return res.status(404).send({
            status: "Error",
            message: "Hay un error en la consulta",
            error: error.message
        });
    }
}

const list = async (req, res) => {
    // Controlar la página
    let page = 1;
    if (req.params.page) {
        page = parseInt(req.params.page);
    }

    // Establecer el número de ítems por página
    const itemsPerPage = 5;

    try {
        // Configuración de opciones de paginación
        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { _id: 1 },  // Orden ascendente por _id
            select: '-password -__v -role -email'
        };

        // Realizar la consulta con paginación
        const result = await User.paginate({}, options);

        let followUserIds = await followService.followUserIds(req.user.id);

        // Devolver resultados
        res.status(200).send({
            status: "success",
            users: result.docs,  // La colección de documentos de usuarios
            page: result.page,  // La página actual
            itemsPerPage: result.limit,  // Máximo número de ítems por página
            total: result.totalDocs,  // Total de documentos que coinciden con la búsqueda
            pages: result.totalPages,  // Total de páginas
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        res.status(404).send({
            status: "error",
            message: "No hay usuarios disponibles",
            error: error.message
        });
    }
};

const update = async (req, res) => {
    // Recoger la información del usuario
    const userIdentity = req.user.id;
    let userToUpdate = req.body;

    // Eliminar campos que no deben ser actualizados o son sensibles
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;

    try {
        // Comprobar si el email o el nick ya están en uso por otro usuario
        const users = await User.find({
            $or: [
                { email: userToUpdate.email ? userToUpdate.email.toLowerCase() : undefined },
                { nick: userToUpdate.nick ? userToUpdate.nick.toLowerCase() : undefined }
            ]
        });

        let userIsset = users.find(user => user && user._id.toString() !== userIdentity);

        if (userIsset) {
            return res.status(409).send({  // 409 Conflict sería más apropiado aquí
                status: "error",
                message: "El email o nick ya está en uso."
            });
        }

        // Cifrar contraseña si se ha proporcionado una nueva
        if (userToUpdate.password) {
            userToUpdate.password = await bcrypt.hash(userToUpdate.password, 10);
        } else {
            delete userToUpdate.password;
        }

        // Buscar y actualizar el usuario
        const updatedUser = await User.findByIdAndUpdate(userIdentity, userToUpdate, { new: true });

        // Devolver los datos actualizados (sin incluir la contraseña o cualquier dato sensible)
        res.status(200).send({
            status: "success",
            message: "Usuario actualizado correctamente.",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: "Error actualizando el usuario",
            error: error.message
        });
    }
}

// Subir avatar
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
    console.log('Extension del archivo:', extension);

    // Comprobar la extensión del archivo
    if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        // Borrar el archivo subido si la extensión es incorrecta
        fs.unlink(req.file.path, err => {
            if (err) {
                console.log('Error al borrar el archivo no soportado:', err);
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
            // Si la extensión es correcta, guardar en BBDD
            const userUpdated = await User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }).exec();

            if (!userUpdated) {
                console.log('Error en la subida del avatar: no se pudo actualizar el usuario');
                return res.status(500).send({
                    status: "error",
                    message: "Error en la subida del avatar"
                });
            }

            console.log('Usuario actualizado con nueva imagen:', userUpdated);

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                user: userUpdated,
                file: req.file
            });

        } catch (error) {
            console.log('Error al actualizar el usuario:', error);
            return res.status(500).send({
                status: "error",
                message: "Error al actualizar el usuario",
                error: error.message
            });
        }
    }
}


const avatar = (req, res) => {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar un path
    const filePath = "./uploads/avatars/" + file;

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
}

// Contador de seguidores y seguidos
const counters = async (req, res) => {
    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        const following = await Follow.countDocuments({ "user": userId });
        const followed = await Follow.countDocuments({ "followed": userId });
        const publications = await Publication.countDocuments({ "user": userId });

        return res.status(200).send({
            userId,
            following,
            followed,
            publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en los contadores",
            error
        });
    }
};



// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
};
