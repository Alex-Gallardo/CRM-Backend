// Definimos el modelo de pedidos
const mongoose = require('mongoose');

const ProductoSchema = mongoose.Schema({
    pedido: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    cliente: {
        // Hacer referencia a la otra coleccion de mongo
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    vendedor: {
        // Hacer referencia a la otra coleccion de mongo
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        default: 'PENDIENTE'
    },
    creado: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('Pedido', ProductoSchema);