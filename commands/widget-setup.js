import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { upsertWidget, getWidget } from "../database.js";

export default {
    data: new SlashCommandBuilder()
        .setName("widget-setup")
        .setDescription("Tùy chỉnh widget profile của bạn")
        .addStringOption(option =>
            option
                .setName("title")
                .setDescription("Tiêu đề custom info (VD: My Info)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("fields")
                .setDescription("Các trường tùy chỉnh (mỗi dòng: Label: Value)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("accent-color")
                .setDescription("Màu accent (hex: #5865f2)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("spotify")
                .setDescription("Spotify profile URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("github")
                .setDescription("GitHub profile URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("youtube")
                .setDescription("YouTube channel URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("twitter")
                .setDescription("Twitter/X profile URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("website")
                .setDescription("Personal website URL")
                .setRequired(false)
        ),

    async execute(interaction) {
        const data = {};

        const title = interaction.options.getString("title");
        const fields = interaction.options.getString("fields");
        const accentColor = interaction.options.getString("accent-color");
        const spotify = interaction.options.getString("spotify");
        const github = interaction.options.getString("github");
        const youtube = interaction.options.getString("youtube");
        const twitter = interaction.options.getString("twitter");
        const website = interaction.options.getString("website");

        if (title) data.custom_title = title;
        if (fields) data.custom_fields = fields;
        if (accentColor) data.accent_color = accentColor;
        if (spotify) data.spotify_link = spotify;
        if (github) data.github_link = github;
        if (youtube) data.youtube_link = youtube;
        if (twitter) data.twitter_link = twitter;
        if (website) data.website_link = website;

        if (Object.keys(data).length === 0) {
            const current = getWidget(interaction.user.id);
            const embed = new EmbedBuilder()
                .setTitle("📋 Widget hiện tại")
                .setColor(current.accent_color || "#5865f2")
                .addFields(
                    { name: "Title", value: current.custom_title || "About Me", inline: true },
                    { name: "Color", value: current.accent_color || "#5865f2", inline: true },
                    { name: "Fields", value: current.custom_fields || "(trống)", inline: false },
                    { name: "Spotify", value: current.spotify_link || "(trống)", inline: true },
                    { name: "GitHub", value: current.github_link || "(trống)", inline: true },
                    { name: "YouTube", value: current.youtube_link || "(trống)", inline: true },
                    { name: "Twitter", value: current.twitter_link || "(trống)", inline: true },
                    { name: "Website", value: current.website_link || "(trống)", inline: true }
                )
                .setFooter({ text: "Sử dụng /widget-setup [option] để thay đổi" });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        upsertWidget(interaction.user.id, data);

        const embed = new EmbedBuilder()
            .setTitle("✅ Widget đã cập nhật!")
            .setDescription("Sử dụng `/widget` để xem widget của bạn")
            .setColor(data.accent_color || "#5865f2");

        const changes = [];
        if (title) changes.push(`**Title:** ${title}`);
        if (fields) changes.push(`**Fields:** ${fields.replace(/\n/g, ", ")}`);
        if (accentColor) changes.push(`**Color:** ${accentColor}`);
        if (spotify) changes.push(`**Spotify:** ${spotify}`);
        if (github) changes.push(`**GitHub:** ${github}`);
        if (youtube) changes.push(`**YouTube:** ${youtube}`);
        if (twitter) changes.push(`**Twitter:** ${twitter}`);
        if (website) changes.push(`**Website:** ${website}`);

        if (changes.length > 0) {
            embed.addFields({ name: "Thay đổi", value: changes.join("\n") });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
