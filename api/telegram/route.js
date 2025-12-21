import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf(process.env.token);

bot.start(ctx => ctx.reply("ربات فعاله"))
bot.on(message("text"), ctx => ctx.reply("hi"));

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send();
        } catch (error) {
            console.error("Bot Error :", error);
            res.status(500).send();

        }

    }
}