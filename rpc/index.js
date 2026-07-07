import { Client } from "@xhayper/discord-rpc";
import { readFileSync, watch, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get user ID from command line args
const userId = process.argv[2];
const CONFIGS_DIR = join(__dirname, "..", "configs");

function getConfigPath() {
    if (userId) {
        return join(CONFIGS_DIR, `${userId}.json`);
    }
    return join(CONFIGS_DIR, "default.json");
}

function loadConfig() {
    const configPath = getConfigPath();
    try {
        if (existsSync(configPath)) {
            return JSON.parse(readFileSync(configPath, "utf-8"));
        }
    } catch (e) {
        console.error(`⚠️ Cannot parse config from ${configPath}`);
    }
    // Fallback to default
    return JSON.parse(readFileSync(join(CONFIGS_DIR, "default.json"), "utf-8"));
}

let config = loadConfig();
const client = new Client({ clientId: config.clientId });

let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

function buildActivity() {
    const activity = {
        details: config.details || undefined,
        state: config.state || undefined,
        largeImageKey: config.largeImageKey || undefined,
        largeImageText: config.largeImageText || undefined,
        smallImageKey: config.smallImageKey || undefined,
        smallImageText: config.smallImageText || undefined,
    };

    // Filter buttons - only include ones with valid URLs
    const validButtons = (config.buttons || []).filter(b => b.url && b.label);
    if (validButtons.length > 0) {
        activity.buttons = validButtons.slice(0, 2); // Max 2 buttons
    }

    return activity;
}

client.on("ready", () => {
    console.log("✅ Connected to Discord!");
    console.log("📋 Setting Rich Presence...");

    client.user?.setActivity(buildActivity());

    console.log("🎮 Rich Presence is now active!");
    console.log("📌 Check your profile to see it.");
    console.log("");
    console.log("Press Ctrl+C to stop.");

    reconnectAttempts = 0;
});

client.on("error", (err) => {
    console.error("❌ RPC Error:", err.message);
});

client.on("disconnected", () => {
    console.log("⚠️  Disconnected from Discord. Attempting to reconnect...");
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT) {
        console.error("❌ Max reconnect attempts reached. Please restart the app.");
        process.exit(1);
    }

    // Reconnect after delay
    setTimeout(() => {
        console.log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT}...`);
        client.login().catch(err => {
            console.error("❌ Reconnect failed:", err.message);
        });
    }, 5000);
});

// Watch config file for changes
const configPath = getConfigPath();
console.log(`📂 Watching config: ${configPath}`);

if (existsSync(configPath)) {
    watch(configPath, () => {
        try {
            const newConfig = JSON.parse(readFileSync(configPath, "utf-8"));
            config = newConfig;
            console.log("🔄 Config reloaded!");
            client.user?.setActivity(buildActivity());
        } catch (e) {
            console.error("❌ Failed to reload config:", e.message);
        }
    });
} else {
    console.log("⚠️ Config file not found. Using defaults. Run /rpc-set in Discord to create it.");
}

// Handle Ctrl+C
process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Rich Presence...");
    client.user?.clearActivity();
    client.destroy();
    process.exit(0);
});

// Login
console.log("🚀 Starting Rich Presence...");
if (userId) {
    console.log(`👤 User ID: ${userId}`);
} else {
    console.log("👤 Using default config");
}
console.log(`📋 App ID: ${config.clientId}`);
console.log(`📝 Details: ${config.details}`);
console.log(`📝 State: ${config.state}`);
console.log("");

client.login().catch(err => {
    console.error("❌ Failed to connect:", err.message);
    console.error("");
    console.error("Make sure Discord is running on your computer!");
    process.exit(1);
});
