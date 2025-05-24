import { characterAnimationConfig } from './config.js';

export function preload() {
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
