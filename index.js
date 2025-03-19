const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

require('dotenv').config();
console.log('Process.env:', process.env);

const CHANNEL_ID = process.env.CHANNEL_ID;
const GUILD_ID = process.env.GUILD_ID;

let isReminderActive = true; 
let reminderInterval =  1000; 
let reminderMessage = 'Time to drink some water! 💧'; 

const waterFacts = [
    'Did you know? The human body is about 60% water!',
    'Drinking water can boost your energy levels!',
    'Hydration helps improve your skin health! 💧',
    'Water aids in digestion and nutrient absorption!',
    'Staying hydrated can improve your focus! 💧',
];

const commands = {
    '!startwater': 'Start the water reminders (Admin only).',
    '!stopwater': 'Stop the water reminders (Admin only).',
    '!setinterval <minutes>': 'Set the reminder interval in minutes (e.g., !setinterval 30) (Admin only).',
    '!setmessage <message>': 'Set a custom reminder message (e.g., !setmessage Drink up!) (Admin only).',
    '!commands': 'Show this command list.',
};

client.once('ready', () => {
    console.log('Loaded CHANNEL_ID:', CHANNEL_ID);
    console.log('Loaded GUILD_ID:', GUILD_ID);
    console.log('WaterBot is online!');
    setTimeout(startWaterReminder, 5000);
});

client.on('messageCreate', (message) => {
    if (!message.guild || !message.member) return; // Ignore DMs

    if (message.content === '!startwater' && message.member.permissions.has('MANAGE_GUILD')) {
        isReminderActive = true;
        message.reply('Water reminders started! 💧');
    } else if (message.content === '!stopwater' && message.member.permissions.has('MANAGE_GUILD')) {
        isReminderActive = false;
        message.reply('Water reminders stopped! 💧');
    }

    if (message.content.startsWith('!setinterval') && message.member.permissions.has('MANAGE_GUILD')) {
        const args = message.content.split(' ');
        const minutes = parseInt(args[1]);
        if (minutes && minutes > 0) {
            reminderInterval = minutes * 60 * 1000;
            message.reply(`Reminder interval set to ${minutes} minutes! 💧`);
        } else {
            message.reply('Please provide a valid number of minutes (e.g., !setinterval 30)!');
        }
    }

    if (message.content.startsWith('!setmessage') && message.member.permissions.has('MANAGE_GUILD')) {
        const newMessage = message.content.replace('!setmessage', '').trim();
        if (newMessage) {
            reminderMessage = newMessage;
            message.reply(`Reminder message set to: ${reminderMessage}`);
        } else {
            message.reply('Please provide a message (e.g., !setmessage Drink up!)!');
        }
    }

    if (message.content === '!commands') {
        const commandList = Object.entries(commands)
            .map(([cmd, desc]) => `**${cmd}** - ${desc}`)
            .join('\n');
        message.reply(`Available commands:\n${commandList}`);
    }
});

function startWaterReminder() {
    setInterval(async () => {
        if (!isReminderActive) return; 
        try {
            if (!CHANNEL_ID) {
                console.log('Channel ID not set in .env!');
                return;
            }
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) {
                console.log('Channel not found!');
                return;
            }

            if (!GUILD_ID) {
                console.log('Guild ID not set in .env!');
                return;
            }
            const guild = client.guilds.cache.get(GUILD_ID);
            if (!guild) {
                console.log('Guild not found!');
                return;
            }

            const members = await guild.members.fetch();
            if (members.size === 0) {
                channel.send('No members found to mention! 💧');
                return;
            }

            const memberMentions = members.map(member => {
                if (member.user.id !== client.user.id) {
                    return `<@${member.id}>`;
                }
            }).filter(Boolean); 
            const limitedMentions = memberMentions.slice(0, 50);

            const mentionString = limitedMentions.join(', ');
            const randomFact = waterFacts[Math.floor(Math.random() * waterFacts.length)];
            const message = `${mentionString}! ${reminderMessage}\n **${randomFact}**`;
            if (message.length > 1900) {
                channel.send(`Too many members to mention! ${members.size - 1} of you, ${reminderMessage} (${randomFact})`);
            } else {
                channel.send(message);
            }
        } catch (error) {
            console.error('Error in reminder:', error);
        }
    }, reminderInterval);
}

client.login(process.env.BOT_TOKEN);
