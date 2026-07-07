import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, "widgets.json");

let widgets = {};

function loadDB() {
    if (existsSync(DB_PATH)) {
        const data = readFileSync(DB_PATH, "utf-8");
        widgets = JSON.parse(data);
    } else {
        widgets = {};
        saveDB();
    }
}

function saveDB() {
    writeFileSync(DB_PATH, JSON.stringify(widgets, null, 2));
}

export function initDB() {
    loadDB();
}

export function getWidget(userId) {
    if (!widgets[userId]) {
        return {
            user_id: userId,
            custom_title: "About Me",
            custom_fields: "",
            spotify_link: "",
            github_link: "",
            youtube_link: "",
            twitter_link: "",
            website_link: "",
            accent_color: "#5865f2",
            show_bio: 1,
            show_social: 1,
            show_activity: 1,
            show_custom: 1,
        };
    }
    return widgets[userId];
}

export function upsertWidget(userId, data) {
    widgets[userId] = { ...getWidget(userId), ...data, user_id: userId };
    saveDB();
}

export function deleteWidget(userId) {
    delete widgets[userId];
    saveDB();
}
