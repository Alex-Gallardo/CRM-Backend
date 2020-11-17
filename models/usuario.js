const mongoose = require('mongoose');

// Esta relacionado con la forma que tiene en el Schema de GraphQL
const UsuariosSchema = mongoose.Schema({
    nombre: {
        type: String,
        require: true,
        trim: true
    },
    apellido: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    },
});

module.exports = mongoose.model('Usuario', UsuariosSchema);