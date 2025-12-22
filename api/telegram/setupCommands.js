import bot from "../../lib/bot.js";



// Setting commands
await bot.telegram.setMyCommands([
    { command: "startgame", description: "شروع بازی 🤹🏻" },
    { command: "joingame", description: "پیوستن به بازی 🤹🏻" },
    { command: "start", description: "شروع" },
    { command: "cancelgame", description: "کنسل کردن بازی 🛑" }
], { scope: { type: "default" } })

export default function (req, res) {
    res.status(200).send();
}