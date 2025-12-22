import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.token);

export default bot;