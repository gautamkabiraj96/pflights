import { config as baseConfig } from './config.js';
import { preload } from './preload.js';
import { create } from './create.js';
import { update } from './update.js';

// Create a new config object for the game,
// spreading the baseConfig and adding the scene functions.
const gameConfig = {
    ...baseConfig, // Spread properties from the imported config
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game with the new combined configuration.
const game = new Phaser.Game(gameConfig);
