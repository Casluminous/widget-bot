import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { initDB } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
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

// Init database
initDB();

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "Có lỗi xảy ra!",
            ephemeral: true,
        });
    }
});

client.once(Events.ClientReady, readyClient => {
    console.log(`✅ Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
