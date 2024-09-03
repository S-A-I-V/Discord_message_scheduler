import { config } from 'dotenv';
config();
import { Client, Routes, SlashCommandBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { REST } from '@discordjs/rest';
import schedule from 'node-schedule';

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '';

const client = new Client({ intents: [] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = [
  new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedules a message')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message to be scheduled')
        .setMinLength(10)
        .setMaxLength(2000)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('time')
        .setDescription('When to schedule the message')
        .setChoices(
          { name: '30 seconds', value: 15000 },
          { name: '1 Minute', value: 60000 },
          { name: '15 Minutes', value: 900000 },
          { name: '30 Minutes', value: 1800000 },
          { name: '1 hour', value: 3600000 }
        )
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel the message should be sent to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .toJSON(),
];

client.on('ready', () => console.log('Bot is online'));

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'schedule') {
      // Check if bot has administrator permissions
      const botMember = await interaction.guild.members.fetch(client.user.id);
      if (!botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'I need administrator permissions to run this command!', ephemeral: true });
      }

      // handle all the logic for schedule command
      const message = interaction.options.getString('message');
      const time = interaction.options.getInteger('time');
      const channel = interaction.options.getChannel('channel');

      if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) {
        return interaction.reply({ content: `I don't have permission to send messages in ${channel.name}`, ephemeral: true });
      }

      const date = new Date(new Date().getTime() + time);
      interaction.reply({
        content: `Your message has been scheduled for ${date.toTimeString()}`,
      });
      console.log(date);
      schedule.scheduleJob(date, () => {
        channel.send({ content: message });
      });
    }
  }
});

async function main() {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    client.login(TOKEN);
  } catch (err) {
    console.log(err);
  }
}

main();
