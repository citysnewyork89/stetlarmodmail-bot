
require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: ['CHANNEL']
});

const GUILD_ID = process.env.GUILD_ID;
const CATEGORY_NAME = "ModMail";

client.once('ready', () => {
    console.log(`🤖 Stelar HelpLine activo como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.type === 1) {
        const guild = await client.guilds.fetch(GUILD_ID);
        const fullGuild = await guild.fetch();
        const category = fullGuild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === 4)
            || await fullGuild.channels.create({
                name: CATEGORY_NAME,
                type: 4
            });

        const existingChannel = fullGuild.channels.cache.find(c =>
            c.name === `ticket-${message.author.id}` && c.parentId === category.id
        );

        if (existingChannel) {
            existingChannel.send(`📨 **${message.author.username}**: ${message.content}`);
        } else {
            const newChannel = await fullGuild.channels.create({
                name: `ticket-${message.author.id}`,
                type: 0,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: fullGuild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ],
            });
            await newChannel.send(`📬 Nuevo ticket de **${message.author.tag}** (${message.author.id})`);
            await newChannel.send(`📨 **${message.author.username}**: ${message.content}`);
            await message.author.send("✅ Tu mensaje fue enviado al staff. Espera aquí la respuesta.");
        }
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith("!responder")) return;

    const args = message.content.split(" ").slice(1);
    const userId = args.shift();
    const respuesta = args.join(" ");
    try {
        const user = await client.users.fetch(userId);
        await user.send(`✉️ Respuesta del staff: ${respuesta}`);
        await message.channel.send("✅ Mensaje enviado.");
    } catch (err) {
        await message.channel.send("❌ No se pudo enviar el mensaje al usuario.");
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    if (message.content === "!cerrar") {
        if (message.channel.name.startsWith("ticket-")) {
            await message.channel.send("🗑️ Cerrando ticket...");
            setTimeout(() => message.channel.delete(), 3000);
        } else {
            await message.channel.send("❌ Este comando solo funciona en canales de ticket.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
