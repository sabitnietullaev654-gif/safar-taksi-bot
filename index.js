require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID ? Number(process.env.GROUP_ID) : null;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || 'your_channel';
const BRAND_NAME = process.env.BRAND_NAME || 'Safar Taksi';

if (!BOT_TOKEN) {
  console.error('XATO: BOT_TOKEN topilmadi. .env faylini tekshiring.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const PHONE_REGEX = /(\+?998[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;

function extractPhone(text) {
  const match = text.match(PHONE_REGEX);
  if (!match) return null;
  let phone = match[0].replace(/[\s()-]/g, '');
  if (!phone.startsWith('+')) {
    if (phone.startsWith('998')) phone = '+' + phone;
    else if (phone.length === 9) phone = '+998' + phone;
  }
  return phone;
}

function buildUserName(from) {
  const parts = [from.first_name, from.last_name].filter(Boolean);
  return parts.join(' ') || from.username || 'Foydalanuvchi';
}

function buildCaption({ userName, userId, text, phone }) {
  let caption = `👤 ${userName}\n🆔 User ID: ${userId}\n\n${text}`;
  if (phone) {
    caption += `\n\n☎️ Тел: ${phone}`;
  }
  caption += `\n\n🚀 ${BRAND_NAME}:\n@${CHANNEL_USERNAME}`;
  return caption;
}

function buildButtons(from) {
  const buttons = [];
  buttons.push([
    Markup.button.url('👤 Клиент личкаси', `tg://user?id=${from.id}`),
  ]);
  if (from.username) {
    buttons.push([
      Markup.button.url('✍️ Клиентга ёзиш', `https://t.me/${from.username}`),
    ]);
  }
  return Markup.inlineKeyboard(buttons);
}

bot.on('text', async (ctx) => {
  try {
    if (GROUP_ID && ctx.chat.id !== GROUP_ID) return;

    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    const from = ctx.message.from;
    if (from.is_bot) return;

    const phone = extractPhone(text);
    const userName = buildUserName(from);

    const caption = buildCaption({
      userName,
      userId: from.id,
      text,
      phone,
    });

    await ctx.telegram.sendMessage(ctx.chat.id, caption, buildButtons(from));

    await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
  } catch (err) {
    console.error('Xabarni qayta ishlashda xato:', err);
  }
});

bot.launch();
console.log('Bot ishga tushdi...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
