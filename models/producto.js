const mongoose = require('mongoose');

// Esta relacionado con la forma que tiene en el Schema de GraphQL
const ProductoSchema = mongoose.Schema({
    nombre: {
        type: String,
        require: true,
        trim: true
    },
    existencias: {
        type: Number,
        require: true,
        trim: true
    },
    precio: {
        type: Number,
        require: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    }
})
// Creamos un index de tipo texto
ProductoSchema.index({ nombre: 'text' });

module.exports = mongoose.model('Producto', ProductoSchema);