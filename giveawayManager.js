import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    Events,
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GIVEAWAYS_FILE = join(__dirname, "giveaways.json");

const activeGiveaways = new Map();
const giveawayTimers = new Map();
let client = null;

function loadGiveaways() {
    if (!existsSync(GIVEAWAYS_FILE)) return [];
    try {
        return JSON.parse(readFileSync(GIVEAWAYS_FILE, "utf-8"));
    } catch {
        return [];
    }
}

function saveGiveaways() {
    writeFileSync(GIVEAWAYS_FILE, JSON.stringify([...activeGiveaways.values()], null, 2));
}

function parseDuration(str) {
    const match = str.match(/^(\d+)\s*(s|m|h|d)$/i);
    if (!match) return null;
    const v = parseInt(match[1]);
    switch (match[2].toLowerCase()) {
        case "s": return v * 1000;
        case "m": return v * 60 * 1000;
        case "h": return v * 60 * 60 * 1000;
        case "d": return v * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

function getRemaining(endTime) {
    const r = endTime - Date.now();
    if (r <= 0) return "Đã kết thúc";
    const s = Math.floor(r / 1000) % 60;
    const m = Math.floor(r / (1000 * 60)) % 60;
    const h = Math.floor(r / (1000 * 60 * 60)) % 24;
    const d = Math.floor(r / (1000 * 60 * 60 * 24));
    const parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0) parts.push(`${s} giây`);
    return parts.join(" ");
}

function em(name) {
    const e = client.emojis.cache.find(e => e.name === name);
    return e ? e.toString() : `:${name}:`;
}

function buildEmbed(g) {
    return new EmbedBuilder()
        .setTitle(`${em("FLY_blue_6")}   **GIVEAWAY**   ${em("FLY_blue_6")}   ${em("sheep_dinor21")}`)
        .setDescription([
            `${em("vos_sheep_dance")}\uFE52\uFE52  **${g.prize}** \uFE55${em("vos_sheep_dance")}`,
            "",
            `${em("Sheep_decor8")} T\u1ED5 ch\u1EE9c b\u1EDFi: <@${g.hostId}>`,
            `${em("Sheep_decor8")} K\u1EBFt th\u00FAc: ${getRemaining(g.endTime)}`,
            `${em("Sheep_decor8")} S\u1ED1 ng\u01B0\u1EDDi tham gia: ${g.entrants.length}`,
        ].join("\n"))
        .setColor("#FFD700")
        .setFooter({ text: "\u{13083} th\u1EAFp nhang tr\u01B0\u1EDBc khi tham gia." })
        .setTimestamp(g.endTime);
}

function buildEndedEmbed(g) {
    const winners = g.winnerIds.length > 0
        ? g.winnerIds.map(id => `<@${id}>`).join(", ")
        : "Không có người thắng";
    return new EmbedBuilder()
        .setTitle(`${em("FLY_blue_6")}   **GIVEAWAY**   ${em("FLY_blue_6")}   ${em("sheep_dinor21")}`)
        .setDescription([
            `${em("vos_sheep_dance")}\uFE52\uFE52  **${g.prize}** \uFE55${em("vos_sheep_dance")}`,
            "",
            `${em("Sheep_decor8")} T\u1ED5 ch\u1EE9c b\u1EDFi: <@${g.hostId}>`,
            `\u{1F3C5} Ng\u01B0\u1EDDi th\u1EAFng: ${winners}`,
            `${em("Sheep_decor8")} T\u1ED5ng s\u1ED1 tham gia: ${g.entrants.length}`,
        ].join("\n"))
        .setColor("#FF4444")
        .setFooter({ text: "\u{13083} Giveaway \u0111\u00E3 k\u1EBFt th\u00FAc." });
}

function setTimer(g) {
    const t = g.endTime - Date.now();
    if (t <= 0) return;
    const timer = setTimeout(async () => {
        g.ended = true;
        await finishGiveaway(g);
        giveawayTimers.delete(g.messageId);
        saveGiveaways();
    }, t);
    giveawayTimers.set(g.messageId, timer);
}

async function finishGiveaway(g) {
    try {
        const channel = await client.channels.fetch(g.channelId);
        const message = await channel.messages.fetch(g.messageId);

        let winners = [];
        if (g.entrants.length > 0) {
            const shuffled = [...g.entrants].sort(() => Math.random() - 0.5);
            const count = Math.min(g.winners, shuffled.length);
            for (let i = 0; i < count; i++) winners.push(shuffled[i]);
        }

        g.winnerIds = winners;
        await message.edit({ embeds: [buildEndedEmbed(g)], components: [] });

        if (winners.length > 0) {
            const mentions = winners.map(id => `<@${id}>`).join(", ");
            await channel.send(`🎉 **Chúc mừng!** ${mentions} đã thắng **${g.prize}**!`);
        } else {
            await channel.send(`Giveaway **${g.prize}** kết thúc nhưng không có ai tham gia.`);
        }
    } catch (error) {
        console.error("Lỗi kết thúc giveaway:", error);
    }
}

export function initGiveawayManager(botClient) {
    client = botClient;
    const saved = loadGiveaways();
    for (const g of saved) {
        if (!g.ended && g.endTime > Date.now()) {
            activeGiveaways.set(g.messageId, g);
            setTimer(g);
        } else if (!g.ended) {
            g.ended = true;
            finishGiveaway(g);
        }
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("giveaway_enter_")) return;

        const messageId = interaction.customId.replace("giveaway_enter_", "");
        const giveaway = activeGiveaways.get(messageId);

        if (!giveaway || giveaway.ended) {
            return interaction.reply({ content: "Giveaway này đã kết thúc!", ephemeral: true });
        }

        if (giveaway.hostId === interaction.user.id) {
            return interaction.reply({ content: "Bạn là host, không thể tham gia!", ephemeral: true });
        }

        if (giveaway.entrants.includes(interaction.user.id)) {
            return interaction.reply({ content: "Bạn đã tham gia rồi!", ephemeral: true });
        }

        giveaway.entrants.push(interaction.user.id);
        saveGiveaways();

        try {
            const channel = await client.channels.fetch(giveaway.channelId);
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [buildEmbed(giveaway)] });
        } catch (e) {}

        await interaction.reply({ content: "🎉 Đã tham gia giveaway!", ephemeral: true });
    });
}

export async function cmdCreate(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "Cần quyền Administrator!", ephemeral: true });
    }

    const prize = interaction.options.getString("prize");
    const durStr = interaction.options.getString("duration");
    const winners = interaction.options.getInteger("winners") || 1;
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    if (!channel.isTextBased()) {
        return interaction.reply({ content: "Kênh không hợp lệ!", ephemeral: true });
    }

    const durMs = parseDuration(durStr);
    if (!durMs) {
        return interaction.reply({ content: "Sai định dạng thời gian! VD: `10m`, `1h`, `1d`", ephemeral: true });
    }

    const endTime = Date.now() + durMs;
    const giveaway = { messageId: null, channelId: channel.id, guildId: interaction.guildId, prize, hostId: interaction.user.id, winners, endTime, entrants: [], ended: false, winnerIds: [] };

    await interaction.deferReply({ ephemeral: true });

    try {
        const button = new ButtonBuilder()
            .setCustomId("giveaway_enter_placeholder")
            .setLabel("🎉 Tham gia")
            .setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(button);
        const TOP = `${em("FLY_blue_6")}   **GIVEAWAY**   ${em("FLY_blue_6")}   ${em("sheep_dinor21")}`;
const msg = await channel.send({ content: TOP, embeds: [buildEmbed(giveaway)], components: [row] });

        giveaway.messageId = msg.id;
        button.setCustomId(`giveaway_enter_${msg.id}`);
        row.components[0] = button;
        await msg.edit({ components: [row] });

        activeGiveaways.set(msg.id, giveaway);
        saveGiveaways();
        setTimer(giveaway);

        await interaction.editReply({ content: `✅ Giveaway đã tạo tại ${channel}!` });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: "Không thể tạo giveaway! Kiểm tra quyền bot." });
    }
}

export async function cmdEnd(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "Cần quyền Administrator!", ephemeral: true });
    }

    const messageId = interaction.options.getString("message-id");
    const giveaway = activeGiveaways.get(messageId);

    if (!giveaway) return interaction.reply({ content: "Không tìm thấy giveaway!", ephemeral: true });
    if (giveaway.ended) return interaction.reply({ content: "Giveaway đã kết thúc!", ephemeral: true });

    const timer = giveawayTimers.get(messageId);
    if (timer) clearTimeout(timer);
    giveawayTimers.delete(messageId);

    giveaway.ended = true;
    await finishGiveaway(giveaway);
    saveGiveaways();

    await interaction.reply({ content: "✅ Đã kết thúc giveaway!", ephemeral: true });
}

export async function cmdReroll(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "Cần quyền Administrator!", ephemeral: true });
    }

    const messageId = interaction.options.getString("message-id");
    const giveaway = activeGiveaways.get(messageId);

    if (!giveaway) return interaction.reply({ content: "Không tìm thấy giveaway!", ephemeral: true });
    if (!giveaway.ended) return interaction.reply({ content: "Giveaway chưa kết thúc!", ephemeral: true });
    if (giveaway.entrants.length === 0) return interaction.reply({ content: "Không ai tham gia!", ephemeral: true });

    const eligible = giveaway.entrants.filter(id => !giveaway.winnerIds.includes(id));
    if (eligible.length === 0) return interaction.reply({ content: "Tất cả đã thắng rồi!", ephemeral: true });

    const count = Math.min(giveaway.winners, eligible.length);
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const newWinners = shuffled.slice(0, count);

    giveaway.winnerIds = [...giveaway.winnerIds, ...newWinners];
    saveGiveaways();

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const msg = await channel.messages.fetch(giveaway.messageId);
        await msg.edit({ embeds: [buildEndedEmbed(giveaway)], components: [] });
    } catch (e) {}

    const mentions = newWinners.map(id => `<@${id}>`).join(", ");
    await interaction.reply({ content: `🎉 Người thắng mới: ${mentions}`, ephemeral: true });

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        await channel.send(`🎉 **REROLL** - Người thắng mới cho **${giveaway.prize}**: ${mentions}`);
    } catch (e) {}
}
