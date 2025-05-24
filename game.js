// configs
const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: 'game-container',
	backgroundColor: '#333333',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 700 },
			debug: false
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

// globals
let player;
let cursors;
let fightKeys;
let playerHealth = 100;
let playerHealthText;
let bots;
let currentLevel = 1;
let levelTimer;
let levelDuration = 60000;
let score = 0;
let scoreText;


const characterAnimationConfig = {
	idle: { sheetFile: 'idle_sheet.png', frameCount: 7, frameRate: 8, repeat: -1 },
	run_left: { sheetFile: 'run_left_sheet.png', frameCount: 7, frameRate: 12, repeat: -1 },
	run_right: { sheetFile: 'run_right_sheet.png', frameCount: 7, frameRate: 12, repeat: -1 },
	jump: { sheetFile: 'jump_sheet.png', frameCount: 19, frameRate: 10, repeat: 0 },
	halfslash: { sheetFile: 'halfslash_sheet.png', frameCount: 23, frameRate: 15, repeat: 0 },
	hurt: { sheetFile: 'hurt_sheet.png', frameCount: 5, frameRate: 10, repeat: 0 }
};

const game = new Phaser.Game(config);

function preload() {
	this.load.image('background', 'background.png');
	this.load.image('debug-square', 'health_booster_placeholder.png');

	for (const animKey in characterAnimationConfig) {
		const animData = characterAnimationConfig[animKey];
		const sheetKey = `character_${animKey}_sheet`;
		this.load.spritesheet(sheetKey, animData.sheetFile, {
			frameWidth: 64,
			frameHeight: 64
		});
	}
	this.load.spritesheet('bot_sheet', 'bot_placeholder_sheet.png', { frameWidth: 64, frameHeight: 64 });
	this.load.image('healthBooster', 'health_booster_placeholder.png');
	console.log("Preload complete");
}

function create() {
	console.log("Create started");
	this.cameras.main.setBackgroundColor('#333333');

	const ground = this.physics.add.staticGroup();
	ground.create(400, 580, 'debug-square').setScale(20, 1).refreshBody().setVisible(false);

	try {
		this.add.image(config.width / 2, config.height / 2, 'background');
	} catch (e) {
		console.error("Background image failed to load:", e);
	}

	for (const animKey in characterAnimationConfig) {
		const animData = characterAnimationConfig[animKey];
		const sheetKey = `character_${animKey}_sheet`;
		try {
			this.anims.create({
				key: `character_${animKey}`,
				frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: animData.frameCount }),
				frameRate: animData.frameRate,
				repeat: animData.repeat
			});
		} catch (e) {
			console.error(`Failed to create animation ${animKey}:`, e);
		}
	}

	try {
		player = this.physics.add.sprite(100, 400, 'character_idle_sheet');
	} catch (e) {
		console.error("Failed to create player with sprite sheet:", e);
		player = this.physics.add.sprite(100, 400);
		player.setDisplaySize(64, 64).setTint(0xff0000);
	}

	player.setBounce(0.1);
	player.setCollideWorldBounds(true);
	player.setDataEnabled();
	if (player.data) {
		player.data.set('isAttacking', false);
		player.data.set('isHurt', false);
	} else {
		console.error("Player data manager not initialized on player sprite!");
	}


	try {
		player.anims.play('character_idle', true);
	} catch (e) {
		console.error("Failed to play idle animation:", e);
	}
	this.physics.add.collider(player, ground);

	cursors = this.input.keyboard.createCursorKeys();
	this.wasd = {
		W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
		A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
		S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
		D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
	};
	fightKeys = this.input.keyboard.addKeys({
		U: Phaser.Input.Keyboard.KeyCodes.U, I: Phaser.Input.Keyboard.KeyCodes.I,
		O: Phaser.Input.Keyboard.KeyCodes.O, P: Phaser.Input.Keyboard.KeyCodes.P
	});

	bots = this.physics.add.group();
	this.physics.add.collider(bots, ground);
	spawnBot(this, 600, 400);
	this.physics.add.collider(player, bots, handlePlayerBotCollision, null, this);

	playerHealthText = this.add.text(16, 16, 'Health: ' + playerHealth, { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	scoreText = this.add.text(config.width - 150, 16, 'Score: ' + score, { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	this.levelTimeText = this.add.text(config.width / 2 - 50, 16, 'Time: ' + (levelDuration / 1000), { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	levelTimer = this.time.addEvent({ delay: levelDuration, callback: levelEnd, callbackScope: this, loop: false });

	player.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (animation, frame, gameObject) {
		if (!gameObject.data) {
			console.error("[ANIM_COMPLETE_CB] gameObject.data is NULL. Animation key:", animation.key);
			return;
		}
		if (animation.key.includes('halfslash') || animation.key.includes('kick')) {
			gameObject.data.set('isAttacking', false);
		}
		if (animation.key === 'character_hurt') {
			gameObject.data.set('isHurt', false);
		}
		if (gameObject.body && gameObject.body.touching.down && gameObject.body.velocity.x === 0) {
			if (gameObject.data && !gameObject.data.get('isAttacking') && !gameObject.data.get('isHurt')) {
				try {
					if (animation.repeat === 0 || (player.anims.currentAnim && player.anims.currentAnim.key !== 'character_idle')) {
						gameObject.anims.play('character_idle', true);
					}
				} catch (e) { console.error("Failed to play idle animation after completion:", e); }
			}
		}
	}, this);
	console.log("Create function completed");
}

function update(time, delta) {
	if (!player || !player.body) {
		if (playerHealth <= 0 && player) gameOver(this);
		return;
	}
	if (playerHealth <= 0) {
		gameOver(this);
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

function spawnBot(scene, x, y) {
	// try {
	// 	const bot = bots.create(x, y, 'bot_sheet');
	// 	bot.setBounce(0.1);
	// 	bot.setCollideWorldBounds(true);
	// 	bot.health = 30;
	// 	bot.setPushable(false);
	// } catch (e) {
	// 	console.error("Failed to spawn bot:", e);
	// 	const bot = bots.create(x, y); // Fallback
	// 	if (bot) {
	// 		bot.setDisplaySize(64, 64).setTint(0x00ff00);
	// 		bot.health = 30;
	// 		bot.setPushable(false);
	// 	}
	// }
}

function handlePlayerBotCollision(player, bot) {
	if (!player.data || !bot) return;

	if (player.data.get('isAttacking')) {
		bot.health -= 10;
		bot.setTint(0xff0000);
		this.time.delayedCall(100, () => { if (bot.active) bot.clearTint(); });

		if (bot.health <= 0) {
			bot.disableBody(true, true);
			score += 10;
			if (Math.random() < 0.3) { /* spawn health booster */ }
		}
	} else if (!player.data.get('isHurt')) {
		playerHealth -= 5;
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

function levelEnd() {
	this.add.text(config.width / 2, config.height / 2, 'LEVEL ' + currentLevel + ' COMPLETE!', { fontSize: '32px', fill: '#0f0' }).setOrigin(0.5);
	this.physics.pause();
}

function gameOver(scene) {
	if (scene.physics.world.isPaused) return;

	scene.physics.pause();
	if (player && player.active) {
		player.setTint(0xff0000);
		player.anims.stop();
	}
	scene.add.text(config.width / 2, config.height / 2, 'GAME OVER', { fontSize: '48px', fill: '#ff0000', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
	scene.add.text(config.width / 2, config.height / 2 + 50, 'Score: ' + score, { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
}
