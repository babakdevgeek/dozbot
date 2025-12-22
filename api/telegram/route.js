import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { Redis } from "@upstash/redis"
const bot = new Telegraf(process.env.token);
const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});

bot.start(ctx => ctx.reply("سلام خوش اومدید برای شروع باید منو داخل یک گروه عضو کنید 🎮🛖"))


bot.command("startgame", async (ctx) => {
    const chatId = ctx.chat.id;
    const exists = await redis.get(`game:${chatId}`);
    if (exists) return ctx.reply("بازی در حال اجراست 🤫");

    const game = {
        board: Array(9).fill(""),
        turn: "b",
        players: [ctx.from.id]
    }

    await redis.set(`game:${chatId}`, game);
    ctx.reply(`بازیکن اول جوین شد 🎊
        بازیکن دوم دستور 
        /joingame را ارسال کند`);
});

bot.command("joingame", async (ctx) => {
    const chatId = ctx.chat.id;
    const game = await redis.get(`game:${chatId}`);
    if (!game) return ctx.reply("ابتدا /startgame را بزنید");
    if (game.players.length === 2) return ctx.reply("دو بازیکنن قبلا ثبت شده اند 🚫");
    if (ctx.from.id === game.players[0]) return ctx.reply("نمی توانی دوباره به عنوان بازیکن دوم وارد شوی 👎🏻")
    game.players.push(ctx.from.id);
    await redis.set(`game:${chatId}`, game);
    ctx.reply(`بازیکن دوم ثبت شد 
        بازی شروع شد ✔️`);
    sendBoard(ctx, game);
})

bot.telegram.setMyCommands([{
    command: "startgame", description: "شروع بازی 🤹🏻",
    command: "joingame", description: "پیوستن به بازی 🤹🏻",
}], { scope: { type: "all_group_chats" } })
bot.action(/^\d$/, async (ctx) => {
    const chatId = ctx.chat.id;
    const game = await redis.get(`game:${chatId}`);
    if (!game) return ctx.answerCbQuery("بازی هنوز شروع نشده");

    const playerId = ctx.from.id;
    const currentPlayer = game.turn === "b" ? game.players[0] : game.players[1];
    if (playerId !== currentPlayer) return ctx.answerCbQuery(`نوبت شما نیست 👎🏻`);

    const idx = parseInt(ctx.match[0]);
    if (game.board[idx]) return ctx.answerCbQuery("خانه پر است 🙊");

    game.board[idx] = game.turn;
    game.turn = game.turn === "b" ? "z" : "b";
    const winner = checkWinner(game.board);
    if (winner) {
        await redis.del(`game:${chatId}`);
        await ctx.editMessageReplyMarkup({
            inline_keyboard: sendBoard(game)
        })
        if (winner === "draw") {
            return ctx.reply("بازی مساوی شد 🟰");
        } else {
            return ctx.reply(`برنده شد 🤹🏻🎊 ${winner}`);
        }
    }

    await redis.set(`game:${chatId}`, game);
    await ctx.editMessageReplyMarkup({
        inline_keyboard: sendBoard(game)
    });
    ctx.answerCbQuery();
})
function checkWinner(board) {
    const wins = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]
    for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(x => x)) return "draw";

    return null;
}
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