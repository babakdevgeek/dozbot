
import { Redis } from "@upstash/redis"
import bot from "../../lib/bot.js"
import { messages } from "../../lib/messages.js";
const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});
messages


bot.start(ctx => ctx.reply("سلام خوش اومدید برای شروع باید منو داخل یک گروه عضو کنید 🎮🛖"))


bot.command("startgame", async (ctx) => {
    if (ctx.chat.type === "private") return ctx.reply("بازی فقط داخل گروه اجرا میشود 🙂");
    const chatId = ctx.chat.id;
    const exists = await redis.get(`game:${chatId}`);
    if (exists) return ctx.reply("بازی در حال اجراست 🤫");

    const game = {
        board: Array(9).fill(""),
        turn: "b",
        players: [{
            id: ctx.from.id,
            first_name: ctx.from.first_name,
            username: ctx.from.username || null
        }],
        boardMessageId: null
    }

    await redis.set(`game:${chatId}`, game);
    const firstPlayerName = game.players[0].first_name;
    await ctx.replyWithAnimation("https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjJzcjF6M3l3cnU2YmNqZzllZHkydTVkdG1sYnJremZ5OGxlZm9xeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/B9WWEhoJQQfjtaQKEG/giphy.gif", {
        caption: messages.start(firstPlayerName),
    })

});

bot.command("joingame", async (ctx) => {
    if (ctx.chat.type === "private") return ctx.reply("بازی فقط داخل گروه اجرا میشود 🙂");
    const chatId = ctx.chat.id;
    const game = await redis.get(`game:${chatId}`);
    if (!game) return ctx.reply("ابتدا /startgame را بزنید");
    if (game.players.length === 2) return ctx.reply("دو بازیکنن قبلا ثبت شده اند 🚫");
    if (ctx.from.id === game.players[0].id) return ctx.reply("نمی توانی دوباره به عنوان بازیکن دوم وارد شوی 👎🏻")
    game.players.push({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        username: ctx.from.username || null
    });
    const secondPlayerName = game.players[1].first_name;
    ctx.reply(messages.joined(secondPlayerName));
    const msgId = sendBoard(ctx, game);
    game.boardMessageId = msgId;
    await redis.set(`game:${chatId}`, game);
})

// Canceling the game 
bot.command("cancelgame", async (ctx) => {
    const chatId = ctx.chat.id;
    const game = await redis.get(`game:${chatId}`);
    if (!game) return ctx.reply("بازی ای یافت نشد 🤷🏻‍♂️");
    await redis.del(`game:${chatId}`);
    ctx.reply(messages.cancel(ctx.from.first_name));
})

// Do on button click 
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
            inline_keyboard: getBoardKeyboard(game)
        })
        if (winner === "draw") {
            return ctx.reply("بازی مساوی شد 🟰");
        } else {
            let winnerFirstname = winner;
            if (winner === "b") winnerFirstname = game.players[0].first_name;
            if (winner === "z") winnerFirstname = game.players[1].first_name;
            return await ctx.replyWithAnimation("https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2RlZ2d6ajNwaW54czFmdHBlcjFlb2F2cWh4cGUzN3RpN2ZnZW56dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Um3ljJl8jrnHy/giphy.gif", { caption: `برنده شد 🤹🏻🎊 ${winnerFirstname}` });
        }
    }
    const firstNameOfNextPlayer = game.turn === "b" ? game.players[1].first_name : game.players[0].first_name
    await redis.set(`game:${chatId}`, game);
    await ctx.editMessageReplyMarkup({
        inline_keyboard: getBoardKeyboard(game)
    });
    ctx.reply(messages.turn(firstNameOfNextPlayer), { reply_parameters: { message_id: game.boardMessageId } });
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
function getBoardKeyboard(game) {
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
    return keyboard;
}

async function sendBoard(ctx, game) {
    const msg = await ctx.reply("بازی دوز :", { reply_markup: { inline_keyboard: getBoardKeyboard(game) } });
    return msg.message_id;
}



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


