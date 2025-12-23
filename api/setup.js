import bot from "../lib/bot.js";

await bot.telegram.setMyCommands([
    { command: "startgame", description: "شروع بازی 🤹🏻" },
    { command: "joingame", description: "پیوستن به بازی 🤹🏻" },
    { command: "start", description: "شروع" },
    { command: "cancelgame", description: "کنسل کردن بازی 🛑" }
], { scope: { type: "all_group_chats" } })