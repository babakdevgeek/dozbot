import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { Redis } from "@upstash/redis"
console.log(process.env.REDIS_TOKEN)
const bot = new Telegraf(process.env.token);
const redis = new Redis({
    token: process.env.REDIS_TOKEN,
    url: process.env.REDIS_URL
})

bot.start(ctx => ctx.reply("ربات فعاله"))


bot.command("startgame", async (ctx) => {
    const chatId = ctx.chat.id;
    const exists = redis.get(`game:${chatId}`);
    console.log(exists)
    if (exists) return ctx.reply("بازی در حال اجراست");

    const game = {
        board: Array(9).fill(""),
        turn: "x",
        players: [ctx.from.id]
    }

    await redis.set(`game:${chatId}`, game);
    ctx.reply(`بازیکن اول جوین شد 
        بازیکن دوم دستور /joingame را ارسال کند`);
});

bot.command("joingame", async (ctx) => {
    const chatId = ctx.chat.id;
    const game = redis.get(`game:${chatId}`);
    if (!game) return ctx.reply("ابتدا /startgame را بزنید");
    if (game.players.length === 2) return ctx.reply("دو بازیکنن قبلا ثبت شده اند");
    game.players.push(ctx.from.id);
    await redis.set(`game:${chatId}`, game);
    ctx.reply(`بازیکن دوم ثبت شد 
        بازی شروع شد`);
    sendBoard(ctx, game);
})

function sendBoard(ctx, game) {
    const board = game.board;
    const keyboard = [];
    for (let i = 0; i < 3; i++) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            row.push({
                text: board[i * 3 + j] || "⬜",
                callback_data: String(i * 3 + j)
            })
        }
        keyboard.push(row);
    }
    ctx.reply("بازی دوز :", { reply_markup: { inline_keyboard: keyboard } })
}


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