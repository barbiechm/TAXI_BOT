require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const http = require('http');
// TU TOKEN DE BOTFATHER
const bot = new Telegraf(process.env.BOT_TOKEN);

// EL ID DEL GRUPO DE CHOFERES (Cámbialo por el tuyo)
const GRUPO_CHOFERES_ID = '-5163485624'; 

// 1. Cuando el usuario inicia
bot.start((ctx) => {
    ctx.reply('¡Hola! ¿Necesitas un taxi?', 
        Markup.keyboard([
            [Markup.button.locationRequest('📍 Pedir Taxi aquí')]
        ]).resize()
    );
});

// 2. Cuando el usuario envía su ubicación
bot.on('location', async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    const usuario = ctx.message.from.first_name;
    const usuarioId = ctx.message.from.id; // Guardamos ID para contactarlo luego

    // Confirmamos al usuario
    ctx.reply('✅ Solicitud enviada. Buscando conductor...');

    // 3. Enviamos la alerta al GRUPO DE CHOFERES
    // Enviamos la ubicación real para que puedan abrirla en Google Maps
    await bot.telegram.sendMessage(GRUPO_CHOFERES_ID, `🚨 NUEVO VIAJE 🚨\nCliente: ${usuario}`, {
        reply_markup: {
            inline_keyboard: [
                // Este botón es la clave: pasa el ID del usuario como dato
                [{ text: '🙋‍♂️ ACEPTAR CARRERA', callback_data: `aceptar_${usuarioId}` }]
            ]
        }
    });
    
    // También enviamos el mapa visual al grupo
    await bot.telegram.sendLocation(GRUPO_CHOFERES_ID, latitude, longitude);
});

// 4. Cuando un chofer presiona el botón
bot.action(/aceptar_(.+)/, async (ctx) => {
    const chofer = ctx.from.first_name;
    const usuarioId = ctx.match[1]; // Recuperamos el ID del cliente del botón

    // Evitamos que otro le de click después
    ctx.editMessageText(`✅ Viaje aceptado por ${chofer}`);

    // Avisamos al Cliente (por privado)
    bot.telegram.sendMessage(usuarioId, `🚗 ¡Tu taxi va en camino!\nConductor: ${chofer}`);

    // Avisamos al Chofer (feedback)
    ctx.answerCbQuery('¡Viaje asignado!');
});

// Encender el bot
bot.launch();


const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('¡El Bot de Taxi está vivo!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// 👇 NUEVO: Esto mantiene el bot encendido
bot.launch(); 
console.log('🤖 Bot TaxiPueblo v2.0 Activo...');

console.log('Bot de Taxi encendido...');

// Para que Render no cierre el proceso (truco)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));