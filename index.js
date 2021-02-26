const { ApolloServer } = require('apollo-server');  // Servidos de Apollo
const typeDefs = require('./db/schema');            // Schema de GraphQL
const resolvers = require('./db/resolvers');        // Resolvers de GraphQL
const jwt = require('jsonwebtoken');                // JsonWebTokens
require('dotenv').config({ path: 'variables.env' }) // Variables de entorno no publicas

// Metodo para iniciar la base de datos
const conectarDB = require('./config/db');

// Conectar a la base de datos
conectarDB();

// Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,

    // Es context es ideal para Authenticacion
    context: ({ req }) => {
        // console.log(req.headers['authorization'])
        // console.log(req.headers);

        // Obtener el token
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                // console.log(usuario)
                // Para pasarlo por context y que este disponible es usuario
                return { usuario }
            } catch (error) {
                console.log('Hubo un error', error)
            }
        }
    }
});

// Arrancar el servidor
server.listen({ port: process.env.PORT || 4000}).then(({ url }) => {
    console.log(`Servidor listo en la URL ${url}`);
});