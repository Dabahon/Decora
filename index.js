// Importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");

// Mensaje de bienvenida
console.log("API NODE para RED SOCIAL arrancada")
// Conexion a BBDD
connection();
// Crear servidor Node
const app = express();
const puerto = process.env.PORT || 3000;

// Configurar Cors
app.use(cors());

// Comvertir datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Cargar las rutas
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {
    return res.status(200).json(
        {
            "id": 1,
            "nombre": "Daniel",
            "web": "decora.com"
        }
    );
});

// Poner servidor a escuchar peticiones http
app.listen(puerto, () => {
    console.log(`Server running on port ${PORT}`);
});