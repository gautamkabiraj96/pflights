import { 
    player, cursors, fightKeys, playerHealth, playerHealthText, 
    bots, levelTimer, score, scoreText 
} from './globals.js';
// gameplay.js will eventually export gameOver.
import { gameOver } from './gameplay.js'; 

export function update(time, delta) {
    // player, cursors, etc., are imported from globals.js.
    // this.wasd and this.levelTimeText are expected to be properties of the scene,
    // set up by the create function.

	if (!player || !player.body) {
		if (playerHealth <= 0 && player) gameOver(this); // Uses imported gameOver
		return;
	}
	if (playerHealth <= 0) {
		gameOver(this); // Uses imported gameOver
		return;
	}

	if (!player.data) {
		console.error("Player data is not available in update loop!");
		return;
	}

	const isPlayerAttacking = player.data.get('isAttacking');
	const isPlayerHurt = player.data.get('isHurt');

	if (!isPlayerAttacking && !isPlayerHurt) {
		if (this.wasd.A.isDown || cursors.left.isDown) {
			player.setVelocityX(-160);
			if (player.body.touching.down) {
				try { player.anims.play('character_run_left', true); }
				catch (e) { console.error("Failed to play run_left animation:", e); }
			}
			player.flipX = false;
		} else if (this.wasd.D.isDown || cursors.right.isDown) {
			player.setVelocityX(160);
			if (player.body.touching.down) {
				try { player.anims.play('character_run_right', true); }
				catch (e) { console.error("Failed to play run_right animation:", e); }
			}
			player.flipX = false;
		} else {
			player.setVelocityX(0);
			if (player.body.touching.down) {
				try { player.anims.play('character_idle', true); }
				catch (e) { console.error("Failed to play idle animation:", e); }
			}
		}

		if ((this.wasd.W.isDown || cursors.up.isDown) && player.body.touching.down) {
			player.setVelocityY(-450);
			try { player.anims.play('character_jump', true); }
			catch (e) { console.error("Failed to play jump animation:", e); }
		}
	} else if (isPlayerAttacking) {
		player.setVelocityX(player.body.velocity.x * 0.5);
	}

	if (!isPlayerAttacking && !isPlayerHurt && player.body.touching.down) {
		if (Phaser.Input.Keyboard.JustDown(fightKeys.U)) {
			player.data.set('isAttacking', true);
			try { player.anims.play('character_halfslash', true); }
			catch (e) { console.error("Failed to play attack animation:", e); }
		}
	}

	bots.getChildren().forEach(bot => {
		if (bot.active && bot.body) {
			if (Math.abs(player.x - bot.x) > 50) {
				if (player.x < bot.x) { bot.setVelocityX(-70); bot.flipX = true; }
				else { bot.setVelocityX(70); bot.flipX = false; }
			} else { bot.setVelocityX(0); }
		}
	});

	playerHealthText.setText('Health: ' + playerHealth);
	scoreText.setText('Score: ' + score);
	if (levelTimer) {
		this.levelTimeText.setText('Time: ' + Math.max(0, Math.ceil((levelTimer.delay - levelTimer.getElapsed()) / 1000)));
	}
}
