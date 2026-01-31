require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);
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
    const usuarioId = ctx.message.from.id;

    ctx.reply('✅ Solicitud enviada. Buscando conductor...');

    await bot.telegram.sendMessage(GRUPO_CHOFERES_ID, `🚨 NUEVO VIAJE 🚨\nCliente: ${usuario}`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🙋‍♂️ ACEPTAR CARRERA', callback_data: `aceptar_${usuarioId}` }]
            ]
        }
    });
    
    await bot.telegram.sendLocation(GRUPO_CHOFERES_ID, latitude, longitude);
});

// 3. Cuando un chofer presiona el botón
bot.action(/aceptar_(.+)/, async (ctx) => {
    const chofer = ctx.from.first_name;
    const usuarioId = ctx.match[1];

    ctx.editMessageText(`✅ Viaje aceptado por ${chofer}`);
    bot.telegram.sendMessage(usuarioId, `🚗 ¡Tu taxi va en camino!\nConductor: ${chofer}`);
    ctx.answerCbQuery('¡Viaje asignado!');
});

// Servidor HTTP para que Render no cierre el servicio
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('¡El Bot de Taxi está vivo!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// ✅ SOLO UNA VEZ: Lanzar el bot
bot.launch()
    .then(() => console.log('🤖 Bot TaxiPueblo v2.0 Activo...'))
    .catch(err => console.error('Error al iniciar el bot:', err));

// Apagado limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));