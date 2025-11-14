const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  if (msg.contact) {
    const phone = msg.contact.phone_number;

    await fetch(process.env.SERVER_URL + "/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });

    bot.sendMessage(msg.chat.id, "OTP Request Sent ✔");
  } else {
    bot.sendMessage(msg.chat.id, "📲 Contact Share ပေးပါ");
  }
});