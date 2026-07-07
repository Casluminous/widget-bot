import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getWidget } from "../database.js";

export default {
    data: new SlashCommandBuilder()
        .setName("widget")
        .setDescription("Xem widget profile của bạn hoặc người khác")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Người muốn xem widget")
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser("user") || interaction.user;
        const widget = getWidget(targetUser.id);

        // Parse custom fields
        const customFields = widget.custom_fields
            .split("\n")
            .filter(line => line.includes(":"))
            .map(line => {
                const colonIndex = line.indexOf(":");
                return {
                    label: line.slice(0, colonIndex).trim(),
                    value: line.slice(colonIndex + 1).trim(),
                };
            });

        // Try to get presence/activity (may fail without intents)
        let activities = [];
        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            activities = member.presence?.activities?.filter(a => a.type !== 4) || [];
        } catch (e) {
            // Presence not available
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(targetUser.username)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .setColor(widget.accent_color || "#5865f2");

        // Description with global name
        if (targetUser.globalName) {
            embed.setDescription(`*${targetUser.globalName}*`);
        }

        // Custom fields
        if (widget.show_custom && customFields.length > 0) {
            const fieldsText = customFields
                .map(f => `**${f.label}:** ${f.value}`)
                .join("\n");
            embed.addFields({
                name: `📋 ${widget.custom_title || "About Me"}`,
                value: fieldsText,
                inline: false,
            });
        }

        // Social links
        if (widget.show_social) {
            const links = [];
            if (widget.spotify_link) links.push(`🎵 [Spotify](${widget.spotify_link})`);
            if (widget.github_link) links.push(`💻 [GitHub](${widget.github_link})`);
            if (widget.youtube_link) links.push(`📺 [YouTube](${widget.youtube_link})`);
            if (widget.twitter_link) links.push(`🐦 [Twitter](${widget.twitter_link})`);
            if (widget.website_link) links.push(`🌐 [Website](${widget.website_link})`);

            if (links.length > 0) {
                embed.addFields({
                    name: "🔗 Liên kết",
                    value: links.join("\n"),
                    inline: false,
                });
            }
        }

        // Activity
        if (widget.show_activity && activities.length > 0) {
            const activityText = activities.slice(0, 3).map(a => {
                const icon = a.type === 0 ? "🎮" : a.type === 2 ? "🎵" : "📋";
                let text = `${icon} **${a.name}**`;
                if (a.details) text += `\n> ${a.details}`;
                if (a.state) text += `\n> ${a.state}`;
                return text;
            }).join("\n");

            embed.addFields({
                name: "⚡ Hoạt động",
                value: activityText,
                inline: false,
            });
        }

        // Footer
        embed.setFooter({
            text: `Widget by ${interaction.guild.name}`,
            iconURL: interaction.guild.iconURL(),
        });

        await interaction.reply({ embeds: [embed] });
    },
};
