const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
  host: 'fafasachu.aternos.me',
  port: 25565,
  username: 'bartender_bill',
  auth: 'offline',
  version: '1.20.4',
});

const DRINK_TOKEN_NAME = 'diamond';
const DRINK_TOKEN_ITEM = 'diamond';
const POTION_ITEM_NAME = 'potion';
let musicPlaying = false;

// === Random bartender phrases ===
const bartenderQuotes = [
  "🍷 Fancy a refill?",
  "✨ This wine's aged 2000 ticks!",
  "💬 Tip your bartender, folks!",
  "🧪 I mix potions, not emotions.",
  "👀 Anyone seen the jukebox key?",
  "🎵 Got a music disc? I’ve got moves.",
  "💎 Diamonds are a drink’s best friend.",
  "🍶 Wine not?",
  "🎭 I perform better after a redstone reboot.",
  "🧃 Ever tried fermented spider eye on the rocks?"
];

// Say something every 10 minutes
setInterval(() => {
  const quote = bartenderQuotes[Math.floor(Math.random() * bartenderQuotes.length)];
  bot.chat(quote);
}, 10 * 60 * 1000); // 10 minutes

bot.once('spawn', () => {
  bot.chat('🍷 Bartender is now active!');
});

// === Diamond for potion trade ===
bot.on('playerCollect', async (collector, collected) => {
  if (collector.username !== bot.username) return;

  setTimeout(async () => {
    const token = bot.inventory.items().find((item) => item.name === DRINK_TOKEN_ITEM);
    if (token) {
      bot.chat(`✅ Token detected: ${DRINK_TOKEN_NAME}`);

      const hopper = bot.findBlock({
        matching: (block) => block.name === 'hopper',
        maxDistance: 10,
      });

      if (hopper) {
        bot.chat('🔍 Hopper found. Tossing diamond...');

        try {
          await bot.lookAt(hopper.position.offset(0.5, 0.5, 0.5));
          await bot.equip(token, 'hand');
          await bot.tossStack(token);
        } catch (err) {
          console.log('❌ Toss error:', err);
          bot.chat('❌ Could not toss diamond into hopper.');
        }

        await bot.look(bot.entity.yaw + Math.PI, 0);
      }

      // Give custom potion via command
      bot.chat('/give @p potion[potion_contents={custom_color:13061821,custom_effects:[{id:poison,duration:50,amplifier:1},{id:nausea,duration:600,amplifier:200}]},custom_name=[{"text":"Wine","italic":false}]]');

    }
  }, 1000);
});

// === Music disc player with toggle & dance ===
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  if (message.toLowerCase() === 'stop music') {
    const jukebox = bot.findBlock({
      matching: block => block.name === 'jukebox',
      maxDistance: 6
    });

    if (!jukebox) {
      bot.chat('❌ No jukebox found nearby.');
      return;
    }

    try {
      await bot.lookAt(jukebox.position.offset(0.5, 0.5, 0.5));
      await bot.activateBlock(jukebox); // Eject current disc
      musicPlaying = false;
      bot.chat('⏹️ Music stopped.');
    } catch (err) {
      console.log('❌ Error stopping music:', err);
      bot.chat('❌ Could not stop music.');
    }
    return;
  }

  if (message.toLowerCase().startsWith('play music disc')) {
    const discName = message.slice('play music disc '.length).trim();
    const formattedDiscName = discName.replace(/ /g, '_');
    const itemName = `music_disc_${formattedDiscName}`;
    const discItem = bot.inventory.items().find(item => item.name === itemName);

    if (!discItem) {
      bot.chat(`❌ I don't have "${discName}" in my inventory.`);
      return;
    }

    const jukebox = bot.findBlock({
      matching: block => block.name === 'jukebox',
      maxDistance: 6
    });

    if (!jukebox) {
      bot.chat('❌ No jukebox found nearby.');
      return;
    }

    try {
      await bot.lookAt(jukebox.position.offset(0.5, 0.5, 0.5));

      if (musicPlaying) {
        await bot.activateBlock(jukebox); // Eject current disc
        await bot.waitForTicks(10);
      }

      await bot.equip(discItem, 'hand');
      await bot.activateBlock(jukebox); // Insert new disc
      musicPlaying = true;

      bot.chat(`🎶 Now playing: ${discName}`);

      // 💃 Dance wiggle
      for (let i = 0; i < 2; i++) {
        await bot.look(bot.entity.yaw + Math.PI / 2, 0);
        await bot.waitForTicks(10);
        await bot.look(bot.entity.yaw - Math.PI / 2, 0);
        await bot.waitForTicks(10);
      }

      await bot.look(bot.entity.yaw + Math.PI, 0); // Final 180°

    } catch (err) {
      console.log('❌ Error playing disc:', err);
      bot.chat('❌ Could not play the music disc.');
    }
  }
});
