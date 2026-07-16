import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName("getemojis")
        .setDescription("Xem danh sách emoji trong server kèm ID"),

    async execute(interaction) {
        const emojis = interaction.guild.emojis.cache;

        if (emojis.size === 0) {
            return interaction.reply({ content: "Server không có emoji nào.", ephemeral: true });
        }

        // Save to file for auto-setup
        const emojiMap = {};
        for (const [, emoji] of emojis) {
            emojiMap[emoji.name] = `<:${emoji.name}:${emoji.id}>`;
        }
        const emojiPath = join(__dirname, "..", "emojis.json");
        writeFileSync(emojiPath, JSON.stringify(emojiMap, null, 2));

        const pages = [];
        let chunk = [];

        for (const [, emoji] of emojis) {
            const line = `${emoji} \`<:${emoji.name}:${emoji.id}>\` — ${emoji.name}`;
            if (chunk.join("\n").length + line.length > 3800) {
                pages.push(chunk.join("\n"));
                chunk = [line];
            } else {
                chunk.push(line);
            }
        }
        if (chunk.length > 0) pages.push(chunk.join("\n"));

        const embed = new EmbedBuilder()
            .setTitle(`📋 Emoji trong ${interaction.guild.name}`)
            .setDescription(pages[0])
            .setColor("#5865f2")
            .setFooter({ text: `Trang 1/${pages.length} • Tổng: ${emojis.size} emoji • Đã lưu vào emojis.json` });

        await interaction.reply({ embeds: [embed], ephemeral: true });

        if (pages.length > 1) {
            for (let i = 1; i < pages.length; i++) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`📋 Emoji (tiếp theo)`)
                            .setDescription(pages[i])
                            .setColor("#5865f2")
                            .setFooter({ text: `Trang ${i + 1}/${pages.length}` }),
                    ],
                    ephemeral: true,
                });
            }
        }
    },
};
