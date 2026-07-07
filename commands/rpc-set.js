import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIGS_DIR = join(__dirname, "..", "configs");
const DEFAULT_CONFIG = join(__dirname, "..", "rpc", "config.json");

// Ensure configs directory exists
if (!existsSync(CONFIGS_DIR)) {
    mkdirSync(CONFIGS_DIR, { recursive: true });
}

function getUserConfigPath(userId) {
    return join(CONFIGS_DIR, `${userId}.json`);
}

function loadConfig(userId) {
    const userPath = getUserConfigPath(userId);
    if (existsSync(userPath)) {
        return JSON.parse(readFileSync(userPath, "utf-8"));
    }
    // Load default config
    const defaultConfig = JSON.parse(readFileSync(DEFAULT_CONFIG, "utf-8"));
    defaultConfig.clientId = "1523994279670972488";
    return defaultConfig;
}

function saveConfig(userId, config) {
    const userPath = getUserConfigPath(userId);
    writeFileSync(userPath, JSON.stringify(config, null, 2));
}

export default {
    data: new SlashCommandBuilder()
        .setName("rpc-set")
        .setDescription("Tùy chỉnh Rich Presence widget trên profile")
        .addStringOption(option =>
            option
                .setName("details")
                .setDescription("Dòng 1 (VD: Rank: Member | Joined: 2022)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("state")
                .setDescription("Dòng 2 (VD: Fav Game: Wuthering Waves)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("large-image")
                .setDescription("URL ảnh lớn hoặc tên asset trên Developer Portal")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("large-image-text")
                .setDescription("Tooltip khi hover ảnh lớn")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("small-image")
                .setDescription("URL ảnh nhỏ hoặc tên asset trên Developer Portal")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("small-image-text")
                .setDescription("Tooltip khi hover ảnh nhỏ")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("button1-label")
                .setDescription("Label nút 1 (chỉ người khác thấy)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("button1-url")
                .setDescription("URL nút 1")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("button2-label")
                .setDescription("Label nút 2 (chỉ người khác thấy)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("button2-url")
                .setDescription("URL nút 2")
                .setRequired(false)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const config = loadConfig(userId);
        const changes = [];

        const details = interaction.options.getString("details");
        const state = interaction.options.getString("state");
        const largeImage = interaction.options.getString("large-image");
        const largeImageText = interaction.options.getString("large-image-text");
        const smallImage = interaction.options.getString("small-image");
        const smallImageText = interaction.options.getString("small-image-text");
        const button1Label = interaction.options.getString("button1-label");
        const button1Url = interaction.options.getString("button1-url");
        const button2Label = interaction.options.getString("button2-label");
        const button2Url = interaction.options.getString("button2-url");

        if (details !== null) { config.details = details; changes.push(`**Details:** ${details}`); }
        if (state !== null) { config.state = state; changes.push(`**State:** ${state}`); }
        if (largeImage !== null) { config.largeImageKey = largeImage; changes.push(`**Large Image:** ${largeImage}`); }
        if (largeImageText !== null) { config.largeImageText = largeImageText; changes.push(`**Large Image Text:** ${largeImageText}`); }
        if (smallImage !== null) { config.smallImageKey = smallImage; changes.push(`**Small Image:** ${smallImage}`); }
        if (smallImageText !== null) { config.smallImageText = smallImageText; changes.push(`**Small Image Text:** ${smallImageText}`); }

        // Update buttons
        if (!config.buttons) config.buttons = [];
        if (button1Label !== null || button1Url !== null) {
            if (!config.buttons[0]) config.buttons[0] = { label: "", url: "" };
            if (button1Label !== null) config.buttons[0].label = button1Label;
            if (button1Url !== null) config.buttons[0].url = button1Url;
            changes.push(`**Button 1:** ${button1Label || config.buttons[0].label} → ${button1Url || config.buttons[0].url}`);
        }
        if (button2Label !== null || button2Url !== null) {
            if (!config.buttons[1]) config.buttons[1] = { label: "", url: "" };
            if (button2Label !== null) config.buttons[1].label = button2Label;
            if (button2Url !== null) config.buttons[1].url = button2Url;
            changes.push(`**Button 2:** ${button2Label || config.buttons[1].label} → ${button2Url || config.buttons[1].url}`);
        }

        // Remove empty buttons
        config.buttons = config.buttons.filter(b => b.label && b.url);

        if (changes.length === 0) {
            // Show current config
            const embed = new EmbedBuilder()
                .setTitle("📋 Rich Presence hiện tại của bạn")
                .setColor("#5865f2")
                .addFields(
                    { name: "Details", value: config.details || "(trống)", inline: true },
                    { name: "State", value: config.state || "(trống)", inline: true },
                    { name: "Large Image", value: config.largeImageKey || "(trống)", inline: true },
                    { name: "Large Image Text", value: config.largeImageText || "(trống)", inline: true },
                    { name: "Small Image", value: config.smallImageKey || "(trống)", inline: true },
                    { name: "Small Image Text", value: config.smallImageText || "(trống)", inline: true }
                )
                .setFooter({ text: "Sử dụng /rpc-set [option] để thay đổi | /rpc-help để xem hướng dẫn" });

            if (config.buttons.length > 0) {
                const btnText = config.buttons.map((b, i) => `**${i + 1}.** ${b.label} → ${b.url}`).join("\n");
                embed.addFields({ name: "Buttons", value: btnText, inline: false });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        saveConfig(userId, config);

        const embed = new EmbedBuilder()
            .setTitle("✅ Rich Presence đã cập nhật!")
            .setDescription("Config đã lưu. Hãy chạy RPC app trên máy bạn:\n`node rpc/index.js " + userId + "`")
            .setColor("#5865f2")
            .addFields({ name: "Thay đổi", value: changes.join("\n") })
            .setFooter({ text: "RPC app sẽ tự reload nếu đang chạy" });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
