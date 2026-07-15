import { SlashCommandBuilder } from "discord.js";
import { cmdCreate, cmdEnd, cmdReroll } from "../giveawayManager.js";

export default {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Quản lý giveaway")
        .addSubcommand(sub =>
            sub
                .setName("create")
                .setDescription("Tạo giveaway mới")
                .addStringOption(opt =>
                    opt.setName("prize").setDescription("Giải thưởng").setRequired(true))
                .addStringOption(opt =>
                    opt.setName("duration").setDescription("Thời gian (VD: 10m, 1h, 1d)").setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName("winners").setDescription("Số người thắng (mặc định: 1)").setRequired(false))
                .addChannelOption(opt =>
                    opt.setName("channel").setDescription("Kênh đăng giveaway (mặc định: kênh hiện tại)").setRequired(false))
        )
        .addSubcommand(sub =>
            sub
                .setName("end")
                .setDescription("Kết thúc giveaway sớm")
                .addStringOption(opt =>
                    opt.setName("message-id").setDescription("ID tin nhắn của giveaway").setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName("reroll")
                .setDescription("Reroll người thắng")
                .addStringOption(opt =>
                    opt.setName("message-id").setDescription("ID tin nhắn của giveaway").setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "create") await cmdCreate(interaction);
        else if (sub === "end") await cmdEnd(interaction);
        else if (sub === "reroll") await cmdReroll(interaction);
    },
};
