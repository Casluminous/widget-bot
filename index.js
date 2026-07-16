import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events, ActivityType } from "discord.js";
import { readdirSync, readFileSync, existsSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { initDB } from "./database.js";
import { initGiveawayManager } from "./giveawayManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Load commands
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(pathToFileURL(filePath).href);
    if ("data" in command.default && "execute" in command.default) {
        client.commands.set(command.default.data.name, command.default);
    }
}

// Init database & giveaway manager
initDB();
initGiveawayManager(client);

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "Có lỗi xảy ra!", ephemeral: true });
        } else {
            await interaction.reply({ content: "Có lỗi xảy ra!", ephemeral: true });
        }
    }
});

// Auto-reply listener
const AUTOREPLIES_PATH = join(__dirname, "autoreplies.json");

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (!existsSync(AUTOREPLIES_PATH)) return;

    let data;
    try {
        data = JSON.parse(readFileSync(AUTOREPLIES_PATH, "utf-8"));
    } catch {
        return;
    }

    const guildReplies = data[message.guildId];
    if (!guildReplies) return;

    const content = message.content.toLowerCase();
    for (const rule of guildReplies) {
        if (content.includes(rule.trigger)) {
            await message.reply(rule.response);
            break;
        }
    }
});

client.once(Events.ClientReady, readyClient => {
    console.log(`✅ Logged in as ${readyClient.user.tag}`);
    readyClient.user.setPresence({
        activities: [{
            name: "Alternate in Alternative",
            type: ActivityType.Playing,
        }],
        status: "online",
    });
});

process.on("unhandledRejection", error => {
    console.error("Unhandled rejection:", error);
});

client.login(process.env.DISCORD_TOKEN);
