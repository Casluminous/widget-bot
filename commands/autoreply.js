import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUTOREPLIES_PATH = join(__dirname, "..", "autoreplies.json");

function loadData() {
    if (!existsSync(AUTOREPLIES_PATH)) return {};
    try {
        return JSON.parse(readFileSync(AUTOREPLIES_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    writeFileSync(AUTOREPLIES_PATH, JSON.stringify(data, null, 2));
}

function getGuildReplies(guildId) {
    const data = loadData();
    return data[guildId] || [];
}

function setGuildReplies(guildId, replies) {
    const data = loadData();
    data[guildId] = replies;
    saveData(data);
}

export default {
    data: new SlashCommandBuilder()
        .setName("autoreply")
        .setDescription("Quản lý auto-reply theo từ khóa")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub
                .setName("add")
                .setDescription("Thêm auto-reply mới")
                .addStringOption(opt =>
                    opt.setName("trigger").setDescription("Từ khóa kích hoạt").setRequired(true))
                .addStringOption(opt =>
                    opt.setName("response").setDescription("Nội dung reply").setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName("remove")
                .setDescription("Xóa auto-reply")
                .addStringOption(opt =>
                    opt.setName("trigger").setDescription("Từ khóa muốn xóa").setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("Xem danh sách auto-reply")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (sub === "add") {
            const trigger = interaction.options.getString("trigger").toLowerCase();
            const response = interaction.options.getString("response");
            const replies = getGuildReplies(guildId);

            if (replies.some(r => r.trigger === trigger)) {
                return interaction.reply({ content: `❌ Từ khóa \`${trigger}\` đã tồn tại!`, ephemeral: true });
            }

            replies.push({ trigger, response });
            setGuildReplies(guildId, replies);

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-reply đã thêm")
                .setColor("#5865f2")
                .addFields(
                    { name: "Trigger", value: `\`${trigger}\``, inline: true },
                    { name: "Response", value: response, inline: true }
                );

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        else if (sub === "remove") {
            const trigger = interaction.options.getString("trigger").toLowerCase();
            const replies = getGuildReplies(guildId);
            const idx = replies.findIndex(r => r.trigger === trigger);

            if (idx === -1) {
                return interaction.reply({ content: `❌ Không tìm thấy từ khóa \`${trigger}\``, ephemeral: true });
            }

            const removed = replies.splice(idx, 1)[0];
            setGuildReplies(guildId, replies);

            await interaction.reply({
                content: `✅ Đã xóa auto-reply: \`${removed.trigger}\` → ${removed.response}`,
                ephemeral: true,
            });
        }

        else if (sub === "list") {
            const replies = getGuildReplies(guildId);

            if (replies.length === 0) {
                return interaction.reply({ content: "📭 Chưa có auto-reply nào.", ephemeral: true });
            }

            const list = replies.map((r, i) => `**${i + 1}.** \`${r.trigger}\` → ${r.response}`).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("📋 Danh sách Auto-reply")
                .setDescription(list)
                .setColor("#5865f2")
                .setFooter({ text: `Tổng cộng: ${replies.length} auto-reply` });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
