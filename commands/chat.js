import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("chat")
        .setDescription("Gửi tin nhắn tùy chỉnh đến kênh được chỉ định")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Kênh muốn gửi tin nhắn")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("content")
                .setDescription("Nội dung tin nhắn")
                .setRequired(true)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel("channel");
        const content = interaction.options.getString("content");

        if (!channel.isTextBased()) {
            return interaction.reply({
                content: "Chỉ có thể gửi tin nhắn đến kênh văn bản!",
                ephemeral: true,
            });
        }

        try {
            await channel.send(content);
            await interaction.reply({
                content: `Đã gửi tin nhắn đến ${channel}!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "Không thể gửi tin nhắn đến kênh này! Hãy kiểm tra quyền của bot.",
                ephemeral: true,
            });
        }
    },
};
