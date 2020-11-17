// Definimos el modelo de clientes
const mongoose = require('mongoose');

const ClientesSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    empresa: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    telefono: {
        type: String,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    },
    vendedor: {
        // Guarda los "_id" como "ObjectId"
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Donde esta la referencia
        ref: 'Usuario'
    }
})

module.exports = mongoose.model('Cliente', ClientesSchema);