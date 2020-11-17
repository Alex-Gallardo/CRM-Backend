// Configuracion de la base de datos
// Mongoose para manejo los esquemas y modelos de los datos asi mismo peticiones
const mongoose = require('mongoose');
// Variables de entorno no publicas
require('dotenv').config({ path: 'variables.env' })

const conectarDB = async () => {
    try {
        // Conectar a DB y configuraciones de errores
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
        })
        console.log('- DB Conectada -');
    } catch (error) {
        console.log('Hubo un error');
        console.log(error);
        process.exit(1);    // Detener la app
    }
}

module.exports = conectarDB;