import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(pathToFileURL(filePath).href);
    if ("data" in command.default) {
        commands.push(command.default.data.toJSON());
    }
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const GUILD_ID = "1515918003462607019";

try {
    console.log(`🔄 Updating ${commands.length} commands to guild ${GUILD_ID}...`);

    const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
        { body: commands }
    );

    console.log(`✅ Updated ${data.length} commands`);
} catch (error) {
    console.error(error);
}
