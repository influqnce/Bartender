const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
  host: 'Fremds-KQcg.aternos.me',
  port: 25565,
  username: 'bartender_bill',
  auth: 'offline',
  version: '1.20.4',
});

const DRINK_TOKEN_ITEM = 'diamond';
const POTION_ITEM_NAME = 'potion';
let musicPlaying = false;

// === Random Phrase Every 10 Minutes ===
const phrases = [
  "🍷 Fancy a drink?",
  "🥂 Cheers, traveler!",
  "💬 Tip your bartender!",
  "🎶 Got any tunes you like?",
  "💎 Diamonds for drinks, folks!"
];

setInterval(() => {
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  bot.chat(phrase);
}, 10 * 60 * 1000); // every 10 minutes

bot.once('spawn', () => {
  bot.chat('🍷 Bartender is now active!');
});

// === Diamond for Potion Trade ===
bot.on('playerCollect', async (collector, collected) => {
  if (collector.username !== bot.username) return;

  setTimeout(async () => {
    const token = bot.inventory.items().find((item) => item.name === DRINK_TOKEN_ITEM);
    if (token) {
      bot.chat(`✅ Token detected: ${DRINK_TOKEN_ITEM}`);

      const hopper = bot.findBlock({
        matching: (block) => block.name === 'hopper',
        maxDistance: 10,
      });

      if (hopper) {
        bot.chat('🔍 Hopper found. Tossing diamond...');

        try {
          await bot.lookAt(hopper.position.offset(0.5, 0.2, 0.5)); // aim low to prevent tossing upward
          await bot.equip(token, 'hand');
          await bot.tossStack(token);
          bot.chat('/give @p potion[potion_contents={custom_color:13061821,custom_effects:[{id:poison,duration:50,amplifier:1},{id:nausea,duration:600,amplifier:200}]},custom_name:[{"text":"Wine","italic":false}]]');
        } catch (err) {
          console.log('❌ Toss error:', err);
          bot.chat('❌ Could not toss diamond into hopper.');
        }

        await bot.look(bot.entity.yaw + Math.PI, 0); // Turn around
      } else {
        bot.chat('❌ No hopper found nearby.');
      }

      const potionItem = bot.inventory.items().find((item) => item.name === POTION_ITEM_NAME);
      if (potionItem) {
        bot.tossStack(potionItem, (err) => {
          if (err) {
            bot.chat('❌ Failed to toss potion.');
          } else {
            bot.chat('🍶 Here is your drink!');
          }
        });
      } else {
        bot.chat('❌ No potion in inventory.');
      }
    }
  }, 1000);
});

// === Music Disc Player with Dance ===
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const args = message.toLowerCase().split(' ');

  // === Stop Music ===
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

  // === Play Music ===
  if (args[0] === 'play') {
    let discItem;

    if (args[1] === 'random') {
      const allDiscs = bot.inventory.items().filter(item => item.name.startsWith('music_disc_'));
      if (allDiscs.length === 0) {
        bot.chat('❌ I have no music discs to play.');
        return;
      }
      discItem = allDiscs[Math.floor(Math.random() * allDiscs.length)];
    } else {
      const discName = args.slice(1).join('_');
      const itemName = `music_disc_${discName}`;
      discItem = bot.inventory.items().find(item => item.name === itemName);

      if (!discItem) {
        bot.chat(`❌ I don't have "${args.slice(1).join(' ')}" in my inventory.`);
        return;
      }
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

      const niceName = discItem.name.replace('music_disc_', '').replace(/_/g, ' ');
      bot.chat(`🎶 Now playing: ${niceName}`);

      // Dance wiggle
      for (let i = 0; i < 2; i++) {
        await bot.look(bot.entity.yaw + Math.PI / 2, 0);
        await bot.waitForTicks(10);
        await bot.look(bot.entity.yaw - Math.PI / 2, 0);
        await bot.waitForTicks(10);
      }

      await bot.look(bot.entity.yaw + Math.PI, 0); // Final spin

    } catch (err) {
      console.log('❌ Error playing disc:', err);
      bot.chat('❌ Could not play the music disc.');
    }
  }
});
