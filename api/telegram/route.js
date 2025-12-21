import bot from "../../bot/bot";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            await bot.handleUpdate(req.body)
        } catch (error) {
            console.error("Bot Error :", error);
        }

        return new Response(JSON.stringify({ ok: true }, { status: 200 }));
    }
}