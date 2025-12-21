import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf(process.env.token);

bot.start(ctx => ctx.reply("ربات فعاله"))
bot.on(message("text"), ctx => ctx.reply("hi"));



export default bot;