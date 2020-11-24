const Usuario = require('../models/usuario');       // Modelo Usuario
const Producto = require('../models/producto');       // Modelo Producto
const Cliente = require('../models/cliente');       // Modelo Cliente
const Pedido = require('../models/Pedido');       // Modelo Cliente
const bcryptjs = require('bcryptjs');               // Hasher
const jwt = require('jsonwebtoken');                // JsonWebToken
require('dotenv').config({ path: 'variables.env' }) // Variables de entorno no publicas

// Funcion de crear token
const crearToken = (usuario, secreta, expiresIn) => {
    const { id, nombre, email, apellido } = usuario
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn })
}

// Resolvers
const resolvers = {
    Query: {

        // OBTENER UN USUARIO
        obtenerUsuario: async (_, { }, ctx) => {
            // const usuarioID = await jwt.verify(token, process.env.SECRETA);
            // return usuarioID;

            // El context ya contiene el usuario y su informacion de la base de datos
            return ctx.usuario;
        },

        // OBTENER PRODUCTOS
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error)
            }
        },

        // OBTENER PRODUCTO POR ID
        obtenerProductoId: async (_, { id }) => {
            // Revisar si el producto existe
            const existe = await Producto.findById(id);
            if (!existe) {
                throw new Error('Producto no encontrado')
            }
            return existe
        },

        // OBTENER TODOS LOS CLIENTES
        obtenerClientes: async () => {
            try {
                const clientes = Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error)
            }
        },

        // OBTENER CLIENTES DEL VENDEDOR
        obtenerClientesVendedor: async (_, { }, ctx) => {
            try {
                const clientes = Cliente.find({ vendedor: ctx.usuario.id.toString() });
                return clientes;
            } catch (error) {
                console.log(error)
            }
        },

        // OBTENER UN CLIENTE
        obtenerCliente: async (_, { id }, ctx) => {
            // Revisar si el cliente existe o no
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }
            // Quien lo creo puede verlo
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            return cliente;
        },

        // OBTENER TODOS LOS PEDIDOS
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log('Hubo un error al intentar obtener los pedidos', error);
            }
        },

        // OBTENER PEDIDOS POR VENDEDOR
        obtenerPedidosVendedor: async (_, { }, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
                return pedidos;
            } catch (error) {
                console.log('Hubo un error al obtener los pedidos del vendedor\n', error);
            }
        },

        // OBTENER PEDIDO POR ID Y SOLO LO PUEDE VER QUIEN LO CREO
        obtenerPedido: async (_, { id }, ctx) => {
            // Si el pedido existe o no
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }
            // Solo quien lo creo puede verlo
            if (pedido.vendedor.toString() != ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Retornar el resultado
            return pedido;
        },

        // OBTENER TODOS LOS PEDIDOS POR EL ESTADO
        obtenerPedidosEstado: async (_, { estado }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });
            return pedidos;
        },

        // MEJORES CLIENTES
        mejoresClientes: async () => {
            // aggregate: Son varias (Array) funciones que se realizan antes de devolverte un resultado
            const clientes = await Pedido.aggregate([
                // WHERE: Obtener los pedidos completados
                { $match: { estado: 'COMPLETADO' } },
                // Cuanto nos ha comprado el cliente
                {
                    $group: {
                        // Busca en el modelo cliente (en minusculas)
                        _id: '$cliente',
                        // Suma de todo lo que el cliente halla comprado
                        total: { $sum: '$total' }
                    }
                },
                // Saber la informacion del cliente
                {
                    $lookup: {
                        // Modelo (en minusculas)
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },
                // Cambia el orden de mayor a menor
                {
                    $sort: { total: -1 }
                }
            ]);
            return clientes;
        },

        // MEJORES VENDEDORES
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: '$vendedor',
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3
                },
                { $sort: { total: -1 } }
            ])
            return vendedores
        },

        // BUSCAR PRODUCTO
        buscarProducto: async (_, { texto }) => {
            const productos = await Producto.find({ $text: { $search: texto } }).limit(10);
            return productos;
        }
    },
    Mutation: {

        // CREAR UN NUEVO USUARIO
        nuevoUsuario: async (_, { input }) => {
            const { email, password } = input;
            // Revisar si el usuario ya esta registrado
            const existeUsuario = await Usuario.findOne({ email });
            if (existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }
            // Hashear su password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);
            try {
                // Guardar en la base de datos
                const usuario = new Usuario(input);
                usuario.save(); // guardarlo
                return usuario;
            } catch (error) {
                console.log('Hubo un error', error);
            }
        },

        // AUNTENTICAR USUARIO
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;
            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            if (!existeUsuario) {
                throw new Error('El usuario no existe');
            }
            // Revisar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto) {
                throw new Error('El password es incorrecto');
            }
            // Crear el token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },

        // CREAR UN NUEVO PRODUCTO
        nuevoProducto: async (_, { input }) => {
            try {
                // Crear producto nuevo
                const producto = new Producto(input);
                // Alamacenar en la base de datos
                const resultado = await producto.save();
                return resultado;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },

        // ACTUALIZAR UN PRODUCTO
        actualizarProducto: async (_, { id, input }) => {
            // Revisar si el producto existe
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }
            // Guardarlo en la base de datos
            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
            return producto;
        },

        // ELIMINAR UN PRODUCTO
        eliminarProducto: async (_, { id }) => {
            // Revisar si existe o no
            let producto = await Producto.findById(id)
            if (!producto) {
                throw new Error('Producto no encontrado');
            }
            // Eliminarlo de la base de datos
            producto = await Producto.findByIdAndDelete({ _id: id });
            return 'Producto eliminado'
        },

        // CREAR NUEVO CLIENTE
        nuevoCliente: async (_, { input }, ctx) => {
            console.log(ctx)
            // Verificar si el cliente ya esta registrado
            const { email } = input
            const cliente = await Cliente.findOne({ email })
            if (cliente) {
                throw new Error('Ese cliente ya esta registrado');
            }
            const nuevoCliente = new Cliente(input);
            // Asignar el vendedor
            nuevoCliente.vendedor = ctx.usuario.id
            // Guardarlo en la base de datos
            try {
                const resultado = await nuevoCliente.save();
                return resultado
            } catch (error) {
                console.log('Hubo un error', error)
            }
        },

        // ACTUALIZAR UN CLIENTE
        actualizarCliente: async (_, { id, input }, ctx) => {
            // Verificar si existe o no
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Ese cliente no existe');
            }
            // Verificar si es el vendedor quien lo edita
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Guardar cambios \\ { new: true } retorna el nuevo registro
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true })
            return cliente
        },

        // ELIMINAR UN CLIENTE
        eliminarCliente: async (_, { id }, ctx) => {
            // Verificar si existe o no
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Ese cliente no existe');
            }
            // Verificar si es el vendedor quien lo elimina
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Guardar cambios \\ { new: true } retorna el nuevo registro
            cliente = await Cliente.findOneAndDelete({ _id: id })
            return 'Cliente eliminado'
        },

        // CREAR UN NUEVO PEDIDO
        nuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input
            // Verificar si el cliente existe
            let clienteExiste = await Cliente.findById(cliente)
            if (!clienteExiste) {
                throw new Error('El cliente no existe')
            }
            // Verificar si el cliente es del vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            // Revisar si el stock esta disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`)
                } else {
                    // Restar la cantidad disponible
                    producto.existencias = producto.existencias - articulo.cantidad
                    // Guardar en la base de datos
                    await producto.save()
                }
            };
            // Crear un nuevo pedido
            const nuevoPedido = new Pedido(input)
            // Asignarle un vendedor
            nuevoPedido.vendedor = ctx.usuario.id;
            // Guardarlo en la base de datos
            const resultado = await nuevoPedido.save()
            return resultado;
        },

        // ACTUALIZAR PEDIDO
        actualizarPedido: async (_, { id, input }, ctx) => {
            const { cliente } = input;
            // Verificar si el pedido existe
            const existePedido = await Pedido.findById(id);
            if (!existePedido) {
                throw new Error('El pedido no existe')
            }
            // Verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('El cliente no existe')
            }
            // Si el cliente y pedido pertenecen al vendedor
            if (existeCliente.vendedor.toString() != ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Revisar el stock solo si se modificaron los articulos
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`)
                    } else {
                        // Restar la cantidad disponible
                        producto.existencias = producto.existencias - articulo.cantidad
                        // Guardar en la base de datos
                        await producto.save()
                    }
                };
            }
            // Guardar el pedido
            const resultado = await Pedido.findByIdAndUpdate({ _id: id }, input, { new: true })
            return resultado;
        },

        // ELIMINAR UN PEDIDO
        eliminarPedido: async (_, { id }, ctx) => {
            // Verifcar si el pedido existe
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }
            // Si el vendedor es quien lo intenta borrar
            if (pedido.vendedor.toString() != ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Guardar en la base de datos
            await Pedido.findOneAndDelete({ _id: id });
            return 'Pedido eliminado';
        }
    }
}

module.exports = resolvers