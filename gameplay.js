import { config } from './config.js';
import { 
    player, 
    bots, 
    playerHealth, 
    score, 
    currentLevel 
} from './globals.js';

export function spawnBot(scene, x, y) {
	// try {
	// 	const bot = bots.create(x, y, 'bot_sheet'); // Uses imported bots
	// 	bot.setBounce(0.1);
	// 	bot.setCollideWorldBounds(true);
	// 	bot.health = 30;
	// 	bot.setPushable(false);
	// } catch (e) {
	// 	console.error("Failed to spawn bot:", e);
	// 	const bot = bots.create(x, y); // Fallback, uses imported bots
	// 	if (bot) {
	// 		bot.setDisplaySize(64, 64).setTint(0x00ff00);
	// 		bot.health = 30;
	// 		bot.setPushable(false);
	// 	}
	// }
    // This function is as per game.js, currently empty (commented out)
}

// 'this' in this function will be the scene, passed by the collider context
export function handlePlayerBotCollision(player, bot) { // player and bot are arguments from collider
	if (!player.data || !bot) return;

	if (player.data.get('isAttacking')) {
		bot.health -= 10; // Assuming bot object has health property
		bot.setTint(0xff0000);
		this.time.delayedCall(100, () => { if (bot.active) bot.clearTint(); });

		if (bot.health <= 0) {
			bot.disableBody(true, true);
			score += 10; // Modifies imported score
			// if (Math.random() < 0.3) { /* spawn health booster */ } // Original comment
		}
	} else if (!player.data.get('isHurt')) {
		playerHealth -= 5; // Modifies imported playerHealth
		playerHealth = Math.max(0, playerHealth);
		player.data.set('isHurt', true);
		try { player.anims.play('character_hurt', true); }
		catch (e) { console.error("Failed to play hurt animation:", e); }
		player.setTint(0xff0000);
		this.time.delayedCall(200, () => { if (player.active) player.clearTint(); });
		const knockbackDirection = (player.x < bot.x) ? -1 : 1;
		player.setVelocityX(knockbackDirection * 100);
		player.setVelocityY(-100);
	}
}

// 'this' in this function will be the scene, passed by the timer's callbackScope
export function levelEnd() {
    // Uses imported config and currentLevel
	this.add.text(config.width / 2, config.height / 2, 'LEVEL ' + currentLevel + ' COMPLETE!', { fontSize: '32px', fill: '#0f0' }).setOrigin(0.5);
	this.physics.pause();
}

export function gameOver(scene) { // scene is passed as an argument
    // Uses imported player, config, and score
	if (scene.physics.world.isPaused) return;

	scene.physics.pause();
	if (player && player.active) {
		player.setTint(0xff0000);
		player.anims.stop();
	}
	scene.add.text(config.width / 2, config.height / 2, 'GAME OVER', { fontSize: '48px', fill: '#ff0000', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
	scene.add.text(config.width / 2, config.height / 2 + 50, 'Score: ' + score, { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
}
