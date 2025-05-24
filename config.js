export const config = {
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
	}
};

export const characterAnimationConfig = {
	idle: { sheetFile: 'idle_sheet.png', frameCount: 7, frameRate: 8, repeat: -1 },
	run_left: { sheetFile: 'run_left_sheet.png', frameCount: 7, frameRate: 12, repeat: -1 },
	run_right: { sheetFile: 'run_right_sheet.png', frameCount: 7, frameRate: 12, repeat: -1 },
	jump: { sheetFile: 'jump_sheet.png', frameCount: 19, frameRate: 10, repeat: 0 },
	halfslash: { sheetFile: 'halfslash_sheet.png', frameCount: 23, frameRate: 15, repeat: 0 },
	hurt: { sheetFile: 'hurt_sheet.png', frameCount: 5, frameRate: 10, repeat: 0 }
};
