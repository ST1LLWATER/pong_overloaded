const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const gameStatusEl = document.getElementById('gameStatus');
const gameOverlayEl = document.getElementById('gameOverlay');
const gameOverlayButtonsEl = document.getElementById('gameOverlayButtons');
const overlayTitleEl = document.getElementById('overlayTitle');
const overlayMessageEl = document.getElementById('overlayMessage');
const overlayStatsEl = document.getElementById('overlayStats');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const difficultySelect = document.getElementById('difficulty');
const gameModeSelect = document.getElementById('gameMode');
const ballSpeedDisplay = document.getElementById('ballSpeedDisplay');
const aiSpeedDisplay = document.getElementById('aiSpeedDisplay');
const gameTimerEl = document.getElementById('gameTimer');
const currentTimeEl = document.getElementById('currentTime');
const playerStreakEl = document.getElementById('playerStreak');
const aiStreakEl = document.getElementById('aiStreak');
const totalHitsEl = document.getElementById('totalHits');
const gamesPlayedEl = document.getElementById('gamesPlayed');
const ballCountEl = document.getElementById('ballCount');
const brickCountEl = document.getElementById('brickCount');
const bricksDestroyedEl = document.getElementById('bricksDestroyed');
const powerupsCollectedEl = document.getElementById('powerupsCollected');
const activePowerupsEl = document.getElementById('activePowerups');
const achievementContainer = document.getElementById('achievementContainer');
const countdownEl = document.getElementById('countdown');

// Game state
let gameRunning = false;
let gamePaused = false;
let gameMode = 'breaker';
let playerScore = 0;
let aiScore = 0;
let playerLives = 3;
let playerStreak = 0;
let aiWinStreak = 0;
let gameStartTime = 0;
let gameTime = 0;
let totalHits = 0;
let bricksDestroyed = 0;
let powerupsCollected = 0;
let gamesPlayed = 0;

// Animation frame ID for game loop
let animationId = null;

// FPS tracking
let fps = 60;
let lastTime = 0;
let frameCount = 0;

// Paddle settings
let paddleWidth = 12;
let paddleHeight = 90;
let basePaddleHeight = 90;
let paddleSpeed = 6;

// Ball settings
const ballSize = 14;
let ballSpeed = 5;
let balls = [];

// Ball trail system
let ballTrails = new Map();
const maxTrailLength = 12;

// Bricks
let bricks = [];
const brickWidth = 60;
const brickHeight = 20;

// Power-ups
let powerups = [];
let activePowerups = [];

// Difficulty settings
const difficulties = {
    easy: { ballSpeed: 4, aiSpeed: 3, paddleSpeed: 7, brickSpawnRate: 0.008 },
    medium: { ballSpeed: 5, aiSpeed: 4, paddleSpeed: 6, brickSpawnRate: 0.012 },
    hard: { ballSpeed: 6, aiSpeed: 5, paddleSpeed: 5, brickSpawnRate: 0.016 },
    insane: { ballSpeed: 8, aiSpeed: 6, paddleSpeed: 4, brickSpawnRate: 0.020 }
};

// Game modes
const gameModes = {
    classic: { hasBricks: false, hasLives: false, hasMultiBall: false, winCondition: 'infinite' },
    breaker: { hasBricks: true, hasLives: true, hasMultiBall: true, winCondition: 'survival' },
    chaos: { hasBricks: true, hasLives: true, hasMultiBall: true, winCondition: 'endless' }
};

// Player paddle (left)
let playerY = canvas.height / 2 - paddleHeight / 2;

// AI paddle (right)
let aiY = canvas.height / 2 - paddleHeight / 2;
let aiSpeed = 4;
let aiIsFrozen = false;
let aiFreezeTime = 0;

// Particle system
let particles = [];

// Achievement system
const achievements = {
    firstWin: { name: '🏆 First Victory!', description: 'Win your first game', unlocked: false },
    brickBreaker: { name: '🧱 Brick Master!', description: 'Destroy 50 bricks', unlocked: false },
    multiBallMaster: { name: '🔴 Multi-Ball Master!', description: 'Have 5 balls active simultaneously', unlocked: false },
    powerupCollector: { name: '⚡ Power Collector!', description: 'Collect 25 power-ups', unlocked: false },
    survivor: { name: '💪 Survivor!', description: 'Survive 5 minutes in Breaker mode', unlocked: false },
    chaosKing: { name: '👑 Chaos King!', description: 'Score 5000 points in Chaos mode', unlocked: false }
};

// Ball class
class Ball {
    constructor(x, y, velX, velY) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.size = ballSize;
        this.trail = [];
        this.id = Math.random().toString(36).substr(2, 9);
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;

        // Update trail
        this.trail.push({ x: this.x, y: this.y, life: 1.0 });
        if (this.trail.length > maxTrailLength) {
            this.trail.shift();
        }

        // Update trail life
        this.trail.forEach(point => {
            point.life -= 0.08;
        });
        this.trail = this.trail.filter(point => point.life > 0);
    }

    draw() {
        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = point.life * 0.4;
            const size = this.size * alpha * 0.8;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(point.x + this.size / 2, point.y + this.size / 2, size / 2 + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw ball
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Brick class
class Brick {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = brickWidth;
        this.height = brickHeight;
        this.type = type;
        this.health = type === 'strong' ? 2 : 1;
        this.maxHealth = this.health;
        this.destroyed = false;
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.destroyed = true;
            return true;
        }
        return false;
    }

    draw() {
        const healthRatio = this.health / this.maxHealth;
        let color = this.type === 'strong' ? '#f59e0b' : '#10b981';
        
        if (healthRatio < 1) {
            color = '#eab308';
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

// Power-up class - FIXED to move towards player paddle
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        // Calculate direction towards player paddle (left side)
        const targetX = paddleWidth + 20; // Target just past the paddle
        const targetY = playerY + paddleHeight / 2; // Target center of player paddle
        
        const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
        const speed = 1.5; // Slower speed so player can react
        
        this.velX = ((targetX - x) / distance) * speed;
        this.velY = ((targetY - y) / distance) * speed;
        
        this.collected = false;
        this.pulse = 0;
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.pulse += 0.1;
    }

    draw() {
        const colors = {
            'multi-ball': '#ef4444',
            'speed-boost': '#f59e0b',
            'paddle-extend': '#eab308',
            'life-up': '#10b981',
            'freeze-ai': '#3b82f6',
            'score-bonus': '#8b5cf6'
        };

        const icons = {
            'multi-ball': '🔴',
            'speed-boost': '🟠',
            'paddle-extend': '🟡',
            'life-up': '🟢',
            'freeze-ai': '🔵',
            'score-bonus': '🟣'
        };

        const color = colors[this.type];
        const icon = icons[this.type];

        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 + Math.sin(this.pulse) * 3;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Icon  
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(icon, this.x + this.size / 2, this.y + this.size / 2 + 5);
        ctx.restore();
    }
}

// Active Power-up class
class ActivePowerUp {
    constructor(type, duration) {
        this.type = type;
        this.duration = duration;
        this.timeLeft = duration;
    }

    update() {
        this.timeLeft -= 16.67; // Assuming 60 FPS
        return this.timeLeft > 0;
    }
}

// Particle class
class Particle {
    constructor(x, y, color, velX = 0, velY = 0) {
        this.x = x;
        this.y = y;
        this.vx = velX || (Math.random() - 0.5) * 6;
        this.vy = velY || (Math.random() - 0.5) * 6;
        this.life = 1;
        this.decay = 0.02;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });
}

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawPaddle(x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, w, h);
    
    // Paddle segments
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 1; i < 3; i++) {
        ctx.fillRect(x, y + (h / 3) * i - 1, w, 2);
    }
    ctx.restore();
}

// Time management
function updateTime() {
    const now = new Date();
    const utcTime = now.toISOString().slice(0, 19).replace('T', ' ');
    currentTimeEl.textContent = utcTime;
}

function updateGameTimer() {
    if (gameRunning && !gamePaused) {
        gameTime = Date.now() - gameStartTime;
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        gameTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// FPS counter
function updateFPS(currentTime) {
    frameCount++;
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Achievement system
function unlockAchievement(key) {
    if (!achievements[key].unlocked) {
        achievements[key].unlocked = true;
        showAchievement(achievements[key]);
    }
}

function showAchievement(achievement) {
    const achievementEl = document.createElement('div');
    achievementEl.className = 'achievement';
    achievementEl.innerHTML = `
        <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 4px; color: #10b981;">${achievement.name}</div>
        <div style="font-size: 0.9em; color: #b0b0b0;">${achievement.description}</div>
    `;
    achievementContainer.appendChild(achievementEl);
    
    setTimeout(() => {
        achievementEl.classList.add('fade-out');
        setTimeout(() => achievementEl.remove(), 500);
    }, 3000);
}

// Game initialization
function initializeBalls() {
    balls = [];
    balls.push(new Ball(
        canvas.width / 2 - ballSize / 2,
        canvas.height / 2 - ballSize / 2,
        ballSpeed * (Math.random() > 0.5 ? 1 : -1),
        ballSpeed * (Math.random() > 0.5 ? 0.5 : -0.5)
    ));
    totalHits = 0;
    updateBallSpeedDisplay();
}

function updateBallSpeedDisplay() {
    ballSpeedDisplay.textContent = ballSpeed;
}

function spawnBrick() {
    const mode = gameModes[gameMode];
    if (!mode.hasBricks) return;
    
    const settings = difficulties[difficultySelect.value];
    if (Math.random() < settings.brickSpawnRate) {
        const x = Math.random() * (canvas.width - brickWidth * 3) + brickWidth;
        const y = Math.random() * (canvas.height * 0.6) + canvas.height * 0.2;
        const type = Math.random() < 0.3 ? 'strong' : 'normal';
        
        // Check for overlaps
        let overlap = false;
        for (let brick of bricks) {
            if (x < brick.x + brick.width && x + brickWidth > brick.x &&
                y < brick.y + brick.height && y + brickHeight > brick.y) {
                overlap = true;
                break;
            }
        }
        
        if (!overlap) {
            bricks.push(new Brick(x, y, type));
        }
    }
}

function spawnPowerUp(x, y) {
    if (Math.random() < 0.3) { // 30% chance
        const types = ['multi-ball', 'speed-boost', 'paddle-extend', 'life-up', 'freeze-ai', 'score-bonus'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push(new PowerUp(x, y, type));
    }
}

function collectPowerUp(powerup) {
    powerupsCollected++;
    
    switch (powerup.type) {
        case 'multi-ball':
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                balls.push(new Ball(
                    powerup.x,
                    powerup.y,
                    Math.cos(angle) * ballSpeed,
                    Math.sin(angle) * ballSpeed
                ));
            }
            break;
            
        case 'speed-boost':
            balls.forEach(ball => {
                ball.velX *= 1.3;
                ball.velY *= 1.3;
            });
            break;
            
        case 'paddle-extend':
            paddleHeight = basePaddleHeight * 1.5;
            activePowerups.push(new ActivePowerUp('paddle-extend', 10000));
            break;
            
        case 'life-up':
            if (gameMode !== 'classic') {
                playerLives++;
            }
            break;
            
        case 'freeze-ai':
            aiIsFrozen = true;
            aiFreezeTime = 5000;
            activePowerups.push(new ActivePowerUp('freeze-ai', 5000));
            break;
            
        case 'score-bonus':
            playerScore += 500;
            break;
    }
    
    createParticles(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2, '#eab308', 12);
}

function updateActivePowerups() {
    activePowerups = activePowerups.filter(powerup => {
        const stillActive = powerup.update();
        
        if (!stillActive) {
            switch (powerup.type) {
                case 'paddle-extend':
                    paddleHeight = basePaddleHeight;
                    break;
                case 'freeze-ai':
                    aiIsFrozen = false;
                    aiFreezeTime = 0;
                    break;
            }
        }
        
        return stillActive;
    });
    
    // Update AI freeze
    if (aiFreezeTime > 0) {
        aiFreezeTime -= 16.67;
        if (aiFreezeTime <= 0) {
            aiIsFrozen = false;
        }
    }
}

function displayActivePowerups() {
    activePowerupsEl.innerHTML = '';
    
    activePowerups.forEach(powerup => {
        const div = document.createElement('div');
        div.className = `active-powerup powerup-${powerup.type}`;
        
        const icons = {
            'paddle-extend': '🟡',
            'freeze-ai': '🔵'
        };
        
        const names = {
            'paddle-extend': 'Extended Paddle',
            'freeze-ai': 'AI Frozen'
        };
        
        div.innerHTML = `
            <span>${icons[powerup.type]}</span>
            <span>${names[powerup.type]}</span>
            <span>${Math.ceil(powerup.timeLeft / 1000)}s</span>
        `;
        
        activePowerupsEl.appendChild(div);
    });
}

// Ball collision detection and physics
function updateBalls() {
    balls.forEach((ball, ballIndex) => {
        ball.update();
        
        // Ball collision with top and bottom walls
        if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
            ball.velY = -ball.velY;
            ball.y = ball.y <= 0 ? 0 : canvas.height - ball.size;
        }
        
        // Ball collision with player paddle
        if (ball.x <= paddleWidth && ball.x + ball.size >= 0 &&
            ball.y + ball.size >= playerY && ball.y <= playerY + paddleHeight &&
            ball.velX < 0) {
            
            ball.velX = -ball.velX;
            let hitPos = (ball.y + ball.size / 2 - playerY) / paddleHeight;
            ball.velY = (hitPos - 0.5) * ballSpeed * 2;
            totalHits++;
            createParticles(ball.x, ball.y + ball.size / 2, '#3b82f6', 6);
        }
        
        // Ball collision with AI paddle
        if (ball.x + ball.size >= canvas.width - paddleWidth && ball.x <= canvas.width &&
            ball.y + ball.size >= aiY && ball.y <= aiY + paddleHeight &&
            ball.velX > 0) {
            
            ball.velX = -ball.velX;
            let hitPos = (ball.y + ball.size / 2 - aiY) / paddleHeight;
            ball.velY = (hitPos - 0.5) * ballSpeed * 2;
            totalHits++;
            createParticles(ball.x + ball.size, ball.y + ball.size / 2, '#8b5cf6', 6);
        }
        
        // Ball collision with bricks
        bricks.forEach((brick, brickIndex) => {
            if (!brick.destroyed &&
                ball.x < brick.x + brick.width &&
                ball.x + ball.size > brick.x &&
                ball.y < brick.y + brick.height &&
                ball.y + ball.size > brick.y) {
                
                // Determine collision side
                let overlapLeft = (ball.x + ball.size) - brick.x;
                let overlapRight = (brick.x + brick.width) - ball.x;
                let overlapTop = (ball.y + ball.size) - brick.y;
                let overlapBottom = (brick.y + brick.height) - ball.y;
                
                let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    ball.velX = -ball.velX;
                } else {
                    ball.velY = -ball.velY;
                }
                
                if (brick.hit()) {
                    bricksDestroyed++;
                    playerScore += brick.type === 'strong' ? 200 : 100;
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#10b981', 10);
                    spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                }
            }
        });
        
        // Ball goes off screen (scoring)
        if (ball.x + ball.size < 0) {
            // AI scores
            if (gameMode === 'classic') {
                aiScore++;
                aiWinStreak++;
                playerStreak = 0;
            } else {
                playerLives--;
                if (playerLives <= 0) {
                    gameOver(false);
                    return;
                }
            }
            balls.splice(ballIndex, 1);
        } else if (ball.x > canvas.width) {
            // Player scores
            playerScore += 100;
            if (gameMode === 'classic') {
                playerStreak++;
                aiWinStreak = 0;
            }
            balls.splice(ballIndex, 1);
        }
    });
    
    // Check if all balls are gone
    if (balls.length === 0 && gameRunning) {
        initializeBalls();
    }
    
    // Remove destroyed bricks
    bricks = bricks.filter(brick => !brick.destroyed);
}

// Updated power-up collision detection - FIXED
function updatePowerups() {
    powerups.forEach((powerup, index) => {
        powerup.update();
        
        // Check collision with player paddle area (expanded collision area)
        const paddleLeft = 10;
        const paddleRight = paddleLeft + paddleWidth + 30; // Extended collision area
        const paddleTop = playerY - 10; // Slightly above paddle
        const paddleBottom = playerY + paddleHeight + 10; // Slightly below paddle
        
        if (powerup.x + powerup.size >= paddleLeft && 
            powerup.x <= paddleRight &&
            powerup.y + powerup.size >= paddleTop && 
            powerup.y <= paddleBottom) {
            collectPowerUp(powerup);
            powerups.splice(index, 1);
        }
        
        // Remove if off screen (left side or too far right)
        if (powerup.x + powerup.size < 0 || powerup.x > canvas.width || 
            powerup.y + powerup.size < 0 || powerup.y > canvas.height) {
            powerups.splice(index, 1);
        }
    });
}

// Update UI state
function updateUIState() {
    if (gameRunning && !gamePaused) {
        document.body.classList.add('game-running');
        gameOverlayButtonsEl.style.display = 'none';
    } else {
        document.body.classList.remove('game-running');
        gameOverlayButtonsEl.style.display = 'flex';
    }
}

// Main game loop
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updateBalls();
    updateAI();
    updatePowerups();
    updateActivePowerups();
    updateParticles();
    updateGameTimer();
    updateTime();
    updateFPS(currentTime);
    
    // Spawn new elements
    if (gameModes[gameMode].hasBricks) {
        spawnBrick();
    }
    
    // Draw everything
    drawPaddle(10, playerY, paddleWidth, paddleHeight, '#3b82f6');
    drawPaddle(canvas.width - paddleWidth - 10, aiY, paddleWidth, paddleHeight, '#8b5cf6');
    
    balls.forEach(ball => ball.draw());
    bricks.forEach(brick => brick.draw());
    powerups.forEach(powerup => powerup.draw());
    
    // Update UI
    updateStats();
    updateScoreDisplay();
    displayActivePowerups();
    
    // Continue game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', restartGame);
fullscreenBtn.addEventListener('click', toggleFullscreen);
difficultySelect.addEventListener('change', changeDifficulty);
gameModeSelect.addEventListener('change', changeGameMode);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            if (gameRunning) togglePause();
            break;
        case 'KeyR':
            e.preventDefault();
            resetGame();
            break;
        case 'Escape':
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            break;
    }
});

// Mouse movement
canvas.addEventListener('mousemove', function(evt) {
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    playerY = mouseY - paddleHeight / 2;
    if (playerY < 0) playerY = 0;
    if (playerY + paddleHeight > canvas.height) playerY = canvas.height - paddleHeight;
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        canvas.parentElement.requestFullscreen().then(() => {
            canvas.parentElement.classList.add('fullscreen');
            fullscreenBtn.innerHTML = '⛶ Exit Fullscreen';
        });
    } else {
        document.exitFullscreen().then(() => {
            canvas.parentElement.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '⛶ Fullscreen';
        });
    }
}

function changeDifficulty() {
    const difficulty = difficultySelect.value;
    const settings = difficulties[difficulty];
    ballSpeed = settings.ballSpeed;
    aiSpeed = settings.aiSpeed;
    paddleSpeed = settings.paddleSpeed;
    
    ballSpeedDisplay.textContent = ballSpeed;
    aiSpeedDisplay.textContent = aiSpeed;
}

function changeGameMode() {
    gameMode = gameModeSelect.value;
    
    if (gameMode === 'classic') {
        playerStreakEl.textContent = 'Streak: 0';
    } else {
        playerStreakEl.textContent = `Lives: ${playerLives}`;
    }
}

function showCountdown() {
    let count = 3;
    countdownEl.style.display = 'block';
    countdownEl.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else if (count === 0) {
            countdownEl.textContent = 'GO!';
        } else {
            countdownEl.style.display = 'none';
            clearInterval(countdownInterval);
            gameStartTime = Date.now();
            initializeBalls();
            // Start the game loop
            animationId = requestAnimationFrame(gameLoop);
        }
    }, 1000);
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        playerScore = 0;
        aiScore = 0;
        playerLives = 3;
        playerStreak = 0;
        bricksDestroyed = 0;
        powerupsCollected = 0;
        bricks = [];
        powerups = [];
        activePowerups = [];
        gameStatusEl.textContent = 'Get Ready...';
        hideOverlay();
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        difficultySelect.disabled = true;
        gameModeSelect.disabled = true;
        updateUIState();
        updateScoreDisplay();
        showCountdown();
    }
}

function restartGame() {
    // First stop the current game
    gameRunning = false;
    gamePaused = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reset all game state
    playerScore = 0;
    aiScore = 0;
    playerLives = 3;
    playerStreak = 0;
    bricksDestroyed = 0;
    powerupsCollected = 0;
    gameTime = 0;
    balls = [];
    bricks = [];
    powerups = [];
    activePowerups = [];
    paddleHeight = basePaddleHeight;
    aiIsFrozen = false;
    aiFreezeTime = 0;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update UI
    updateScoreDisplay();
    updateStats();
    resetPaddles();
    gameTimerEl.textContent = '00:00';
    
    // Hide overlay first
    hideOverlay();
    
    // Start new game after a short delay
    setTimeout(() => {
        startGame();
    }, 200);
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseBtn.textContent = '▶ Resume';
        gameStatusEl.textContent = 'Game Paused';
        showOverlay('Game Paused', 'Click Resume to continue');
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    } else {
        pauseBtn.textContent = '⏸ Pause';
        gameStatusEl.textContent = 'Game Active';
        hideOverlay();
        animationId = requestAnimationFrame(gameLoop);
    }
    updateUIState();
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    playerScore = 0;
    aiScore = 0;
    playerLives = 3;
    playerStreak = 0;
    bricksDestroyed = 0;
    powerupsCollected = 0;
    gameTime = 0;
    balls = [];
    bricks = [];
    powerups = [];
    activePowerups = [];
    paddleHeight = basePaddleHeight;
    aiIsFrozen = false;
    aiFreezeTime = 0;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateScoreDisplay();
    updateStats();
    resetPaddles();
    gameStatusEl.textContent = 'Ready to Play';
    hideOverlay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ Pause';
    difficultySelect.disabled = false;
    gameModeSelect.disabled = false;
    gameTimerEl.textContent = '00:00';
    updateUIState();
}

function resetPaddles() {
    playerY = canvas.height / 2 - paddleHeight / 2;
    aiY = canvas.height / 2 - paddleHeight / 2;
}

function showOverlay(title, message, showRestartButton = false) {
    overlayTitleEl.textContent = title;
    overlayMessageEl.textContent = message;
    
    if (title.includes('Game Over') || title.includes('Victory')) {
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        overlayStatsEl.innerHTML = `
            <div style="margin-bottom: 15px;"><strong>Game Statistics</strong></div>
            <div>Game Time: ${minutes}:${seconds.toString().padStart(2, '0')}</div>
            <div>Total Hits: ${totalHits}</div>
            <div>Bricks Destroyed: ${bricksDestroyed}</div>
            <div>Power-ups Collected: ${powerupsCollected}</div>
            <div>Final Score: ${playerScore} - ${aiScore}</div>
        `;
        
        // Show restart button for game over
        if (showRestartButton) {
            restartBtn.style.display = 'block';
        }
    } else {
        overlayStatsEl.innerHTML = '';
        restartBtn.style.display = 'none';
    }
    
    gameOverlayEl.style.display = 'flex';
}

function hideOverlay() {
    gameOverlayEl.style.display = 'none';
    restartBtn.style.display = 'none';
}

function updateScoreDisplay() {
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
    
    if (gameMode === 'classic') {
        playerStreakEl.textContent = `Streak: ${playerStreak}`;
        aiStreakEl.textContent = `Streak: ${aiWinStreak}`;
    } else {
        playerStreakEl.textContent = `Lives: ${playerLives}`;
        aiStreakEl.textContent = `Streak: ${aiWinStreak}`;
    }
}

function updateStats() {
    ballCountEl.textContent = balls.length;
    brickCountEl.textContent = bricks.length;
    bricksDestroyedEl.textContent = bricksDestroyed;
    powerupsCollectedEl.textContent = powerupsCollected;
    totalHitsEl.textContent = totalHits;
    gamesPlayedEl.textContent = gamesPlayed;
    ballSpeedDisplay.textContent = Math.round(ballSpeed);
}

function gameOver(won = false) {
    gameRunning = false;
    gamePaused = false;
    gamesPlayed++;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const title = won ? '🎉 Victory!' : '💀 Game Over!';
    const message = won ? 'Congratulations! You won!' : 'Game Over. Better luck next time!';
    
    gameStatusEl.textContent = 'Game Over';
    showOverlay(title, message, true); // Show restart button
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    difficultySelect.disabled = false;
    gameModeSelect.disabled = false;
    
    // Check achievements
    if (won && !achievements.firstWin.unlocked) {
        unlockAchievement('firstWin');
    }
    if (bricksDestroyed >= 50) {
        unlockAchievement('brickBreaker');
    }
    if (balls.length >= 5) {
        unlockAchievement('multiBallMaster');
    }
    if (powerupsCollected >= 25) {
        unlockAchievement('powerupCollector');
    }
    if (gameTime >= 300000) { // 5 minutes
        unlockAchievement('survivor');
    }
    if (playerScore >= 5000 && gameMode === 'chaos') {
        unlockAchievement('chaosKing');
    }
}

function updateAI() {
    if (!gameRunning || gamePaused || aiIsFrozen) return;
    
    // Find closest ball
    let closestBall = null;
    let closestDistance = Infinity;
    
    balls.forEach(ball => {
        if (ball.velX > 0) { // Ball moving towards AI
            const distance = canvas.width - ball.x;
            if (distance < closestDistance) {
                closestDistance = distance;
                closestBall = ball;
            }
        }
    });
    
    if (!closestBall && balls.length > 0) {
        closestBall = balls[0];
    }
    
    if (closestBall) {
        let aiCenter = aiY + paddleHeight / 2;
        let ballCenter = closestBall.y + closestBall.size / 2;
        
        // Predict where ball will be
        let predictedY = ballCenter;
        if (closestBall.velX > 0) {
            let timeToReach = (canvas.width - closestBall.x) / closestBall.velX;
            predictedY = closestBall.y + closestBall.velY * timeToReach;
        }
        
        let errorMargin = paddleHeight * (0.3 - difficultySelect.selectedIndex * 0.05);
        let targetY = predictedY - paddleHeight / 2 + (Math.random() - 0.5) * errorMargin;
        
        let moveSpeed = aiSpeed;
        if (Math.abs(aiCenter - targetY) < 10) {
            moveSpeed *= 0.5;
        }
        
        if (aiCenter < targetY) {
            aiY += moveSpeed;
        } else if (aiCenter > targetY) {
            aiY -= moveSpeed;
        }
    }
    
    // Clamp AI paddle
    if (aiY < 0) aiY = 0;
    if (aiY + paddleHeight > canvas.height) aiY = canvas.height - paddleHeight;
}

// Initialize the game on page load
window.addEventListener('load', () => {
    updateTime();
    changeDifficulty();
    changeGameMode();
    updateStats();
    updateScoreDisplay();
    
    // Start time update interval
    setInterval(updateTime, 1000);
    
    // Initial canvas draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});