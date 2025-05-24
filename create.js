import { config, characterAnimationConfig } from './config.js';
import { 
    player, cursors, fightKeys, playerHealth, playerHealthText, 
    bots, currentLevel, levelTimer, levelDuration, score, scoreText 
} from './globals.js';
// As per instructions, only importing spawnBot and levelEnd from gameplay.js
// Updated to include handlePlayerBotCollision
import { spawnBot, levelEnd, handlePlayerBotCollision } from './gameplay.js'; 

export function create() {
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
	spawnBot(this, 600, 400); // Uses imported spawnBot
    // The line below now uses the imported handlePlayerBotCollision
	this.physics.add.collider(player, bots, handlePlayerBotCollision, null, this);

	playerHealthText = this.add.text(16, 16, 'Health: ' + playerHealth, { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	scoreText = this.add.text(config.width - 150, 16, 'Score: ' + score, { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	this.levelTimeText = this.add.text(config.width / 2 - 50, 16, 'Time: ' + (levelDuration / 1000), { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
	levelTimer = this.time.addEvent({ delay: levelDuration, callback: levelEnd, callbackScope: this, loop: false }); // Uses imported levelEnd

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
