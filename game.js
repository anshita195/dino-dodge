const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
canvas.width = 800;
canvas.height = 300;

// Game constants
const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const GROUND_HEIGHT = 50;
const DINO_WIDTH = 50;
const DINO_HEIGHT = 50;
const STONE_SIZE = 30;
const VALLEY_WIDTH = 100;
const INITIAL_GAME_SPEED = 15;
const MAX_GAME_SPEED = 25;
const SPEED_INCREASE_INTERVAL = 20; // Increase speed every 50 points
const SPEED_INCREASE_AMOUNT = 1;
const OBSTACLE_CHANCE = 0.5;
const BACK_MOVEMENT_FRAMES = 30;

// Game state
let score = 0;
let highScore = 0;
let gameOver = false;
let animationId;
let lastObstacleType = null;
let backMovementCounter = 0;
let currentGameSpeed = INITIAL_GAME_SPEED;

// Dino properties
const dino = {
    x: 100,
    y: canvas.height - GROUND_HEIGHT - DINO_HEIGHT,
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isMovingBack: false,
    centerX: 100
};

// Game objects
let valleys = [];
let stones = [];
let groundSegments = [];

// Initialize ground segments
function initGround() {
    groundSegments = [];
    let x = 0;
    while (x < canvas.width) {
        groundSegments.push({
            x: x,
            width: Math.random() * 200 + 100
        });
        x += groundSegments[groundSegments.length - 1].width;
    }
}

// Create a new valley
function createValley() {
    const lastValley = valleys[valleys.length - 1];
    const minDistance = 300;
    const x = lastValley ? lastValley.x + lastValley.width + minDistance + Math.random() * 200 : canvas.width;
    
    valleys.push({
        x: x,
        width: VALLEY_WIDTH
    });
    lastObstacleType = 'valley';
}

// Create a new stone
function createStone() {
    stones.push({
        x: dino.centerX,
        y: 0,
        width: STONE_SIZE,
        height: STONE_SIZE,
        velocityY: 5
    });
    lastObstacleType = 'stone';
}

// Check collisions
function checkCollisions() {
    // Check valley collisions
    for (const valley of valleys) {
        if (dino.x + dino.width > valley.x && dino.x < valley.x + valley.width) {
            // Only game over if touching valley while NOT jumping
            if (!dino.isJumping) {
                endGame();
                return;
            }
        }
    }

    // Check stone collisions
    for (const stone of stones) {
        if (dino.x < stone.x + stone.width &&
            dino.x + dino.width > stone.x &&
            dino.y < stone.y + stone.height &&
            dino.y + dino.height > stone.y) {
            endGame();
            return;
        }
    }
}

// Update game state
function update() {
    if (gameOver) return;

    // Update dino
    if (dino.isJumping) {
        dino.velocityY += GRAVITY;
        dino.y += dino.velocityY;

        // Check ground collision
        if (dino.y > canvas.height - GROUND_HEIGHT - dino.height) {
            dino.y = canvas.height - GROUND_HEIGHT - dino.height;
            dino.isJumping = false;
            dino.velocityY = 0;
        }
    } else {
        // Apply gravity when not jumping
        dino.velocityY += GRAVITY;
        dino.y += dino.velocityY;

        // Check ground collision
        if (dino.y > canvas.height - GROUND_HEIGHT - dino.height) {
            dino.y = canvas.height - GROUND_HEIGHT - dino.height;
            dino.velocityY = 0;
        }
    }

    // Handle backward movement
    if (dino.isMovingBack) {
        dino.x = Math.max(50, dino.x - 5);
        backMovementCounter++;
        if (backMovementCounter >= BACK_MOVEMENT_FRAMES) {
            dino.isMovingBack = false;
            backMovementCounter = 0;
        }
    } else if (dino.x < dino.centerX) {
        // Return to center if not at center, but more slowly
        dino.x = Math.min(dino.centerX, dino.x + 5);
    }

    // Update stones
    for (let i = stones.length - 1; i >= 0; i--) {
        const stone = stones[i];
        stone.y += stone.velocityY;

        // Remove stones that are off screen
        if (stone.y > canvas.height) {
            stones.splice(i, 1);
        }
    }

    // Update valleys
    for (let i = valleys.length - 1; i >= 0; i--) {
        const valley = valleys[i];
        valley.x -= currentGameSpeed;

        // Remove valleys that are off screen
        if (valley.x + valley.width < 0) {
            valleys.splice(i, 1);
            score++;
            scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
            
            // Update high score
            if (score > highScore) {
                highScore = score;
                scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
            }

            // Increase game speed gradually
            if (score % SPEED_INCREASE_INTERVAL === 0 && currentGameSpeed < MAX_GAME_SPEED) {
                currentGameSpeed += SPEED_INCREASE_AMOUNT;
            }
        }
    }

    // Create new obstacles (either valley or stone, not both)
    if (valleys.length === 0 && stones.length === 0) {
        if (Math.random() < OBSTACLE_CHANCE) {
            createValley();
        } else {
            createStone();
        }
    }

    checkCollisions();
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Draw valleys
    ctx.fillStyle = '#000';
    for (const valley of valleys) {
        ctx.fillRect(valley.x, canvas.height - GROUND_HEIGHT, valley.width, GROUND_HEIGHT);
    }

    // Draw dino
    ctx.fillStyle = '#666';
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Draw stones
    ctx.fillStyle = '#444';
    for (const stone of stones) {
        ctx.fillRect(stone.x, stone.y, stone.width, stone.height);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.code === 'Space') {
            resetGame();
        }
        return;
    }

    if (e.code === 'ArrowUp' && !dino.isJumping) {
        dino.isJumping = true;
        dino.velocityY = JUMP_FORCE;
    }

    // Only trigger back movement if at center position and not already moving back
    if (e.code === 'ArrowLeft' && !dino.isJumping && !e.repeat && !dino.isMovingBack && Math.abs(dino.x - dino.centerX) < 1) {
        dino.isMovingBack = true;
        backMovementCounter = 0;
    }
});

// End game
function endGame() {
    gameOver = true;
    gameOverElement.classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

// Reset game
function resetGame() {
    gameOver = false;
    score = 0;
    currentGameSpeed = INITIAL_GAME_SPEED;
    scoreElement.textContent = `Score: ${score} | High Score: ${highScore}`;
    gameOverElement.classList.add('hidden');
    
    // Reset dino
    dino.x = 100;
    dino.y = canvas.height - GROUND_HEIGHT - DINO_HEIGHT;
    dino.velocityY = 0;
    dino.isJumping = false;
    dino.isMovingBack = false;
    dino.centerX = 100;

    // Clear game objects
    valleys = [];
    stones = [];
    
    // Initialize ground
    initGround();
    
    // Start game loop
    gameLoop();
}

// Start game
initGround();
gameLoop(); 