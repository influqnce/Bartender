const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;

const bot = mineflayer.createBot({
  host: 'fafasachu.aternos.me',
  port: 25565,
  username: 'bartender_bill',
  auth: 'offline',
  version: '1.20.4',
});

bot.loadPlugin(pathfinder);

const DRINK_TOKEN_ITEM = 'diamond';
const POTION_ITEM_NAME = 'potion';
let musicPlaying = false;

const mcData = require('minecraft-data')(bot.version);
const defaultMove = new Movements(bot, mcData);

// === Random chat every 10 minutes ===
const phrases = [
  "🍷 Wine me up!",
  "💎 Bring me diamonds and I’ll bring the vibes.",
  "🎶 Got a disc? Let's boogie.",
  "👀 I'm watching you, human.",
  "🍾 Ask nicely and you might get a drink.",
];

function sayRandomPhrase() {
  const random = phrases[Math.floor(Math.random() * phrases.length)];
  bot.chat(random);
}
setInterval(sayRandomPhrase, 10 * 60 * 1000); // 10 minutes

// === On spawn ===
bot.once('spawn', () => {
  bot.chat('🍷 Bartender is now active!');
  bot.pathfinder.setMovements(defaultMove);
});

// === Diamond for potion trade ===
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
        bot.chat('🔍 Hopper found. Approaching...');

        bot.pathfinder.setGoal(new GoalBlock(hopper.position.x, hopper.position.y + 1, hopper.position.z));
        await bot.waitForTicks(20); // Let it move

        try {
          await bot.lookAt(hopper.position.offset(0.5, 1, 0.5));
          await bot.equip(token, 'hand');
          await bot.tossStack(token);
          bot.chat('💎 Diamond tossed into hopper!');
        } catch (err) {
          console.log('❌ Toss error:', err);
          bot.chat('❌ Could not toss diamond into hopper.');
        }

        bot.chat('/give @p potion[potion_contents={custom_color:13061821,custom_effects:[{id:poison,duration:50,amplifier:1},{id:nausea,duration:600,amplifier:200}]},custom_name:[{"text":"Wine","italic":false}]]');

        await bot.look(bot.entity.yaw + Math.PI, 0);
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
      await bot.activateBlock(jukebox);
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
        await bot.activateBlock(jukebox); // Eject
        await bot.waitForTicks(10);
      }

      await bot.equip(discItem, 'hand');
      await bot.activateBlock(jukebox); // Insert
      musicPlaying = true;

      bot.chat(`🎶 Now playing: ${discName}`);

      // 💃 Dance wiggle
      for (let i = 0; i < 2; i++) {
        await bot.look(bot.entity.yaw + Math.PI / 2, 0);
        await bot.waitForTicks(10);
        await bot.look(bot.entity.yaw - Math.PI / 2, 0);
        await bot.waitForTicks(10);
      }

      await bot.look(bot.entity.yaw + Math.PI, 0);

    } catch (err) {
      console.log('❌ Error playing disc:', err);
      bot.chat('❌ Could not play the music disc.');
    }
  }
});
