/**
 * Minijuego: El Rayo Antirafador (Arcade 8-Bit)
 * Usa las imágenes oficiales de Rafamalo y Rafabueno.
 * ¡CUIDADO! Aparecen perritos salchichas en 8 bits (Corchito) a los que NO hay que disparar.
 */

class RayoAntirafadorGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('startGameBtn');
        this.scoreDisplay = document.getElementById('gameScore');
        this.timerDisplay = document.getElementById('gameTimer');
        this.revertedDisplay = document.getElementById('gameRevertedCount');
        this.comboDisplay = document.getElementById('gameCombo');
        this.highScoreDisplay = document.getElementById('gameHighScore');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScoreText = document.getElementById('finalGameScore');
        this.finalRevertedText = document.getElementById('finalGameReverted');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.corchitoPowerBtn = document.getElementById('corchitoPowerBtn');

        this.isPlaying = false;
        this.score = 0;
        this.revertedCount = 0;
        this.combo = 1;
        this.timeLeft = 35;
        this.gameInterval = null;
        this.lastSpawnTime = 0;
        this.spawnRate = 880;
        this.corchitoCharged = true;
        this.shakeTimer = 0;

        this.targets = []; // Rafas y Perritos
        this.particles = [];
        this.lasers = [];
        this.floatingTexts = [];

        this.haterPhrases = [
            "FALSA HUMILDAD", "VIVÍS DE OTROS", "CHETA INFUMABLE",
            "TODO ARMADO", "ANDÁ A LABURAR", "ANTES ERAS HUMILDE",
            "RE FANTOCHE", "¿QUIÉN TE CONOCE?", "TODO CANJE"
        ];

        this.goodPhrases = [
            "¡REINA!", "¡TE BANCO!", "¡BUENA VIBRA!",
            "¡GENIA TOTAL!", "¡ABRAZO!", "¡LAVÉ LOS PLATOS!"
        ];

        // Cargar imágenes oficiales de Rafamalo y Rafabueno (sin fondo)
        this.imgRafaMalo = new Image();
        this.imgRafaMalo.src = 'assets/rafamalo.png';

        this.imgRafaBueno = new Image();
        this.imgRafaBueno.src = 'assets/rafabueno.png';

        this.highScore = parseInt(localStorage.getItem('rafometro_game_highscore') || '0', 10);
        this.updateHighScoreDisplay();

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startGame());
        }

        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.gameOverOverlay.classList.add('hidden');
                this.startGame();
            });
        }

        if (this.corchitoPowerBtn) {
            this.corchitoPowerBtn.addEventListener('click', () => this.triggerCorchitoAttack());
        }

        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerDown(touch);
        }, { passive: false });

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.min(window.innerHeight * 0.55, 450);
    }

    updateHighScoreDisplay() {
        if (this.highScoreDisplay) {
            this.highScoreDisplay.textContent = this.highScore.toLocaleString();
        }
    }

    startGame() {
        if (window.soundSystem) window.soundSystem.playClick();

        this.score = 0;
        this.revertedCount = 0;
        this.combo = 1;
        this.timeLeft = 35;
        this.targets = [];
        this.particles = [];
        this.lasers = [];
        this.floatingTexts = [];
        this.corchitoCharged = true;
        this.isPlaying = true;

        if (this.startBtn) this.startBtn.classList.add('hidden');
        if (this.gameOverOverlay) this.gameOverOverlay.classList.add('hidden');
        this.updateCorchitoBtnUI();
        this.updateStatsUI();

        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timerDisplay) this.timerDisplay.textContent = `${this.timeLeft}s`;

            if (this.timeLeft <= 15) {
                this.spawnRate = 550;
            } else if (this.timeLeft <= 25) {
                this.spawnRate = 700;
            }

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('rafometro_game_highscore', this.highScore);
            this.updateHighScoreDisplay();
        }

        if (this.finalScoreText) this.finalScoreText.textContent = this.score.toLocaleString();
        if (this.finalRevertedText) this.finalRevertedText.textContent = this.revertedCount;
        if (this.gameOverOverlay) this.gameOverOverlay.classList.remove('hidden');

        if (window.soundSystem) {
            window.soundSystem.playFanfare();
        }
    }

    updateCorchitoBtnUI() {
        if (!this.corchitoPowerBtn) return;
        if (this.corchitoCharged) {
            this.corchitoPowerBtn.disabled = false;
            this.corchitoPowerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            this.corchitoPowerBtn.classList.add('animate-bounce');
        } else {
            this.corchitoPowerBtn.disabled = true;
            this.corchitoPowerBtn.classList.add('opacity-50', 'cursor-not-allowed');
            this.corchitoPowerBtn.classList.remove('animate-bounce');
        }
    }

    triggerCorchitoAttack() {
        if (!this.isPlaying || !this.corchitoCharged) return;
        this.corchitoCharged = false;
        this.updateCorchitoBtnUI();

        if (window.soundSystem) {
            window.soundSystem.playCorchitoBark();
        }

        // Revertir a todos los Rafas en pantalla (respetando a los perritos)
        let countReverted = 0;
        this.targets.forEach(item => {
            if (item.type === 'rafa' && item.state === 'hater') {
                this.revertRafa(item, true);
                countReverted++;
            }
        });

        this.floatingTexts.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            text: `¡LADRIDO PURIFICADOR DE CORCHITO! (+${countReverted * 200})`,
            alpha: 1,
            vy: -1.5,
            color: '#eab308'
        });

        setTimeout(() => {
            if (this.isPlaying) {
                this.corchitoCharged = true;
                this.updateCorchitoBtnUI();
            }
        }, 12000);
    }

    spawnTarget() {
        const isPuppy = Math.random() < 0.28; // 28% de probabilidad de que aparezca el perrito salchicha en 8-bits
        const size = isPuppy ? 36 : 38;
        const margin = size + 20;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);

        if (isPuppy) {
            this.targets.push({
                type: 'puppy',
                x,
                y,
                size,
                vx: (Math.random() - 0.5) * 1.8,
                vy: (Math.random() - 0.5) * 1.8,
                alpha: 1,
                born: Date.now(),
                lifetime: 5000,
                phrase: '¡A MÍ NO! 🐶'
            });
        } else {
            const phrase = this.haterPhrases[Math.floor(Math.random() * this.haterPhrases.length)];
            this.targets.push({
                type: 'rafa',
                state: 'hater',
                x,
                y,
                size,
                vx: (Math.random() - 0.5) * 2.3,
                vy: (Math.random() - 0.5) * 2.3,
                alpha: 1,
                born: Date.now(),
                lifetime: 4200,
                phrase
            });
        }
    }

    handlePointerDown(e) {
        if (!this.isPlaying) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const originX = this.canvas.width / 2;
        const originY = this.canvas.height;

        this.lasers.push({
            x1: originX,
            y1: originY,
            x2: clickX,
            y2: clickY,
            alpha: 1
        });

        if (window.soundSystem) {
            window.soundSystem.playLaser();
        }

        let hit = false;
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const item = this.targets[i];
            const dist = Math.hypot(clickX - item.x, clickY - item.y);

            if (dist <= item.size + 15) {
                hit = true;

                if (item.type === 'puppy') {
                    // ¡LE DISPARÓ AL PERRITO SALCHICHA! PENALIZACIÓN
                    this.hitPuppy(item);
                } else if (item.type === 'rafa' && item.state === 'hater') {
                    // Impacto a Rafamalo -> se convierte en Rafabueno
                    this.revertRafa(item);
                }
                break;
            }
        }

        if (!hit) {
            this.combo = 1;
            this.updateStatsUI();
        }
    }

    hitPuppy(puppy) {
        if (window.soundSystem) {
            window.soundSystem.playDogWhimper();
        }

        // Sacudida de pantalla
        this.shakeTimer = 18;

        // Penalización de puntaje
        const penalty = 200;
        this.score = Math.max(0, this.score - penalty);
        this.combo = 1;
        this.updateStatsUI();

        this.floatingTexts.push({
            x: puppy.x,
            y: puppy.y - 30,
            text: `¡A CORCHITO NO! 💔 -${penalty}`,
            alpha: 1,
            vy: -1.2,
            color: '#ef4444'
        });

        // Partículas rojas de alerta
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: puppy.x,
                y: puppy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 2,
                color: '#ef4444',
                alpha: 1,
                life: 30
            });
        }

        // El perrito huye rápido
        puppy.vx *= 3;
        puppy.vy *= 3;
        puppy.phrase = '¡AY GUAU! 😿';
    }

    revertRafa(rafa, isSpecial = false) {
        rafa.state = 'reverted';
        rafa.phrase = this.goodPhrases[Math.floor(Math.random() * this.goodPhrases.length)];
        this.revertedCount++;

        const multiplier = isSpecial ? 2 : this.combo;
        const pointsGained = 100 * multiplier;
        this.score += pointsGained;

        if (!isSpecial) {
            this.combo = Math.min(this.combo + 1, 8);
        }

        this.updateStatsUI();

        if (window.soundSystem && !isSpecial) {
            window.soundSystem.playRevertSuccess();
        }

        this.floatingTexts.push({
            x: rafa.x,
            y: rafa.y - 30,
            text: `+${pointsGained}!`,
            alpha: 1,
            vy: -1.2,
            color: '#16a34a'
        });

        // Partículas festivas
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.5;
            this.particles.push({
                x: rafa.x,
                y: rafa.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                color: ['#facc15', '#22c55e', '#3b82f6', '#f43f5e'][Math.floor(Math.random() * 4)],
                alpha: 1,
                life: 35
            });
        }
    }

    updateStatsUI() {
        if (this.scoreDisplay) this.scoreDisplay.textContent = this.score.toLocaleString();
        if (this.revertedDisplay) this.revertedDisplay.textContent = this.revertedCount;
        if (this.comboDisplay) {
            this.comboDisplay.textContent = `x${this.combo}`;
            this.comboDisplay.className = this.combo > 1 ? "font-pixel text-yellow-600 font-extrabold text-sm" : "font-pixel text-slate-400 font-bold text-xs";
        }
    }

    gameLoop(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Efecto sacudida si le dispararon a Corchito
        let offsetX = 0;
        let offsetY = 0;
        if (this.shakeTimer > 0) {
            offsetX = (Math.random() - 0.5) * 8;
            offsetY = (Math.random() - 0.5) * 8;
            this.shakeTimer--;
        }

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        // Fondo reticulado retro tenue
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        if (this.isPlaying) {
            if (timestamp - this.lastSpawnTime > this.spawnRate && this.targets.length < 9) {
                this.spawnTarget();
                this.lastSpawnTime = timestamp;
            }
        }

        // 1. Rayos láser
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(l.x1, l.y1);
            this.ctx.lineTo(l.x2, l.y2);
            this.ctx.strokeStyle = `rgba(234, 179, 8, ${l.alpha})`;
            this.ctx.lineWidth = 5 * l.alpha;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(l.x1, l.y1);
            this.ctx.lineTo(l.x2, l.y2);
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${l.alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.restore();

            l.alpha -= 0.14;
            if (l.alpha <= 0) {
                this.lasers.splice(i, 1);
            }
        }

        // 2. Objetivos (Rafamalo, Rafabueno y Perrito 8-bit)
        const now = Date.now();
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            target.x += target.vx;
            target.y += target.vy;

            // Rebotar en bordes
            if (target.x - target.size < 5 || target.x + target.size > this.canvas.width - 5) target.vx *= -1;
            if (target.y - target.size < 5 || target.y + target.size > this.canvas.height - 5) target.vy *= -1;

            // Expiración natural
            if (now - target.born > target.lifetime && target.state !== 'reverted') {
                target.alpha -= 0.05;
                if (target.alpha <= 0) {
                    this.targets.splice(i, 1);
                    continue;
                }
            }

            // Si está revertido, sube felizmente al cielo
            if (target.state === 'reverted') {
                target.y -= 1.8;
                target.alpha -= 0.03;
                if (target.alpha <= 0) {
                    this.targets.splice(i, 1);
                    continue;
                }
            }

            this.drawTarget(target);
        }

        // 3. Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 1 / p.life;

            this.ctx.save();
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(p.alpha, 0);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 4. Textos flotantes
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.025;

            this.ctx.save();
            this.ctx.font = "bold 13px 'Press Start 2P', monospace";
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 4;
            this.ctx.globalAlpha = Math.max(ft.alpha, 0);
            this.ctx.fillText(ft.text, ft.x - 30, ft.y);
            this.ctx.restore();

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        this.ctx.restore();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    drawTarget(target) {
        this.ctx.save();
        this.ctx.globalAlpha = target.alpha;

        if (target.type === 'puppy') {
            // DIBUJAR PERRITO SALCHICHA EN 8 BITS (CORCHITO)
            this.draw8BitDachshund(target.x, target.y, target.size);

            // Bocadillo de advertencia
            this.ctx.font = "bold 8px 'Press Start 2P', monospace";
            const textW = this.ctx.measureText(target.phrase).width;
            const bW = textW + 10;
            const bH = 16;
            const bX = target.x - bW / 2;
            const bY = target.y + target.size * 0.7;

            this.ctx.fillStyle = '#fef08a';
            this.ctx.fillRect(bX, bY, bW, bH);
            this.ctx.strokeStyle = '#0f172a';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(bX, bY, bW, bH);

            this.ctx.fillStyle = '#b45309';
            this.ctx.fillText(target.phrase, bX + 5, bY + 11);

        } else if (target.type === 'rafa') {
            const isReverted = target.state === 'reverted';
            const img = isReverted ? this.imgRafaBueno : this.imgRafaMalo;
            const drawSize = target.size * 2;

            if (img.complete && img.naturalWidth > 0) {
                // Dibujar la imagen de Rafamalo / Rafabueno
                this.ctx.drawImage(img, target.x - target.size, target.y - target.size, drawSize, drawSize);
            } else {
                // Fallback circular si aún estuviera cargando
                this.ctx.beginPath();
                this.ctx.arc(target.x, target.y, target.size * 0.8, 0, Math.PI * 2);
                this.ctx.fillStyle = isReverted ? '#facc15' : '#ef4444';
                this.ctx.fill();
            }

            // Halo celestial dorado si está revertido
            if (isReverted) {
                this.ctx.beginPath();
                this.ctx.ellipse(target.x, target.y - target.size - 6, target.size * 0.7, 5, 0, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#eab308';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }

            // Bocadillo con la frase
            this.ctx.font = "bold 9px 'Press Start 2P', monospace";
            const textW = this.ctx.measureText(target.phrase).width;
            const bW = textW + 10;
            const bH = 16;
            const bX = target.x - bW / 2;
            const bY = target.y + target.size + 4;

            this.ctx.fillStyle = isReverted ? '#dcfce7' : '#fee2e2';
            this.ctx.fillRect(bX, bY, bW, bH);
            this.ctx.strokeStyle = '#0f172a';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(bX, bY, bW, bH);

            this.ctx.fillStyle = isReverted ? '#166534' : '#991b1b';
            this.ctx.fillText(target.phrase, bX + 5, bY + 11);
        }

        this.ctx.restore();
    }

    // Dibujo procedural del perro salchicha en 8-bits pixel art
    draw8BitDachshund(cx, cy, radius) {
        const pSize = 3; // Tamaño del píxel
        const startX = cx - 24;
        const startY = cy - 14;

        // Mapa de píxeles del perro salchicha (0 = vacío, 1 = marrón oscuro, 2 = marrón claro / hocico, 3 = negro ojo / nariz)
        const dachshundMap = [
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,3,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,3,0],
            [1,0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0]
        ];

        const colors = {
            1: '#3e2723', // Marrón chocolate clásico salchicha
            2: '#8d6e63', // Caramelo hocico
            3: '#0f172a'  // Negro ojo / nariz
        };

        for (let r = 0; r < dachshundMap.length; r++) {
            for (let c = 0; c < dachshundMap[r].length; c++) {
                const val = dachshundMap[r][c];
                if (val !== 0) {
                    this.ctx.fillStyle = colors[val];
                    this.ctx.fillRect(startX + c * pSize, startY + r * pSize, pSize, pSize);
                }
            }
        }

        // Borde pixelado sutil o aura verde para saber que es bueno
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(startX - 2, startY - 2, dachshundMap[0].length * pSize + 4, dachshundMap.length * pSize + 4);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.rayoGame = new RayoAntirafadorGame();
});
