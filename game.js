const DIFFICULTY_SETTINGS = {
    EASY:   { label: "FÁCIL",   min: 1, max: 1, tripleChance: 0,    speed: 1200 },
    MEDIUM: { label: "MÉDIO",   min: 1, max: 2, tripleChance: 0.1,  speed: 800 },
    HARD:   { label: "DIFÍCIL", min: 1, max: 3, tripleChance: 0.25, speed: 600 }
};

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        // CORREÇÃO DO ERRO AQUI: Definindo como propriedade
        this.load.crossOrigin = 'anonymous';
        
        // Carregue seus assets aqui (ajuste os caminhos se necessário)
        this.load.image('bg', 'assets/background.png');
        for (let i = 1; i <= 11; i++) {
            this.load.image(`slime_${i}`, `assets/slime_${i}.png`);
        }
    }

    create() {
        this.add.text(225, 150, 'SLIME RUSH\nEVOLUTION', { 
            fontSize: '42px', fill: '#0f0', align: 'center', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        ['EASY', 'MEDIUM', 'HARD'].forEach((diff, i) => {
            let btn = this.add.text(225, 400 + (i * 80), DIFFICULTY_SETTINGS[diff].label, { 
                fontSize: '32px', fill: '#fff', backgroundColor: '#222', padding: 10
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => this.scene.start('MainScene', { difficulty: diff }));
            btn.on('pointerover', () => btn.setStyle({ fill: '#0f0' }));
            btn.on('pointerout', () => btn.setStyle({ fill: '#fff' }));
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() { super('MainScene'); }

    init(data) {
        this.config = DIFFICULTY_SETTINGS[data.difficulty || 'MEDIUM'];
        this.score = 0;
        this.isGameOver = false;
        this.isTrailerActive = false;
    }

    create() {
        // Grid e Pooling
        this.slimes = this.add.group({ maxSize: 16 });
        this.gridItems = Array(4).fill().map(() => Array(4).fill(null));

        this.setupBoard();
        this.spawnSlime(2);

        // Score Text
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff' });

        // Atalho para Trailer (Aperte T no NixOS)
        this.input.keyboard.on('keydown-T', () => this.startTrailerMode());
    }

    spawnSlime(forcedCount = null) {
        if (this.isGameOver) return;
        let empty = this.getEmptySlots();
        if (empty.length === 0) return this.gameOver();

        let count = forcedCount || 1;
        if (!forcedCount) {
            let roll = Math.random();
            // Lógica Amanda: Spawn de 3 no Médio e Hard
            if (this.config.max === 3 && roll < this.config.tripleChance) count = 3;
            else if (this.config.max >= 2 && roll > 0.6) count = 2;
        }

        count = Math.min(count, empty.length);
        for (let i = 0; i < count; i++) {
            let slot = Phaser.Utils.Array.GetRandom(this.getEmptySlots());
            if (slot) this.addSlimeToGrid(slot.r, slot.c, Math.random() > 0.9 ? 2 : 1);
        }
    }

    addSlimeToGrid(r, c, level) {
        let slime = this.slimes.get(c * 100 + 75, r * 100 + 250, `slime_${level}`);
        if (slime) {
            slime.setActive(true).setVisible(true).setScale(0);
            slime.level = level;
            slime.gridR = r;
            slime.gridC = c;
            this.gridItems[r][c] = slime;
            this.tweens.add({ targets: slime, scale: 1, duration: 200, ease: 'Back.easeOut' });
        }
    }

    merge(s1, s2) {
        let nextLevel = s1.level + 1;
        this.cameras.main.shake(100, 0.01);
        
        if (nextLevel === 11) { // 2048 - Efeito Amanda
            this.cameras.main.flash(1000, 255, 215, 0);
            this.time.timeScale = 0.5;
            this.time.delayedCall(1000, () => this.time.timeScale = 1);
        }

        this.gridItems[s1.gridR][s1.gridC] = null;
        s1.setActive(false).setVisible(false);
        s2.setTexture(`slime_${nextLevel}`);
        s2.level = nextLevel;

        this.score += Math.pow(2, nextLevel);
        this.scoreText.setText(`Score: ${this.score}`);
        
        this.time.delayedCall(300, () => this.spawnSlime());
    }

    startTrailerMode() {
        if (this.isTrailerActive) return;
        this.isTrailerActive = true;
        this.cameras.main.zoomTo(1.1, 2000);
        console.log("🎥 Gravando trailer...");

        this.time.addEvent({
            delay: 600,
            callback: () => this.autoPlay(),
            loop: true
        });
    }

    autoPlay() {
        // Busca par para merge automático no vídeo
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                let s1 = this.gridItems[r][c];
                if (!s1) continue;
                let targets = [[0,1], [1,0], [0,-1], [-1,0]];
                for(let [dr, dc] of targets) {
                    let nr = r + dr, nc = c + dc;
                    if(nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
                        let s2 = this.gridItems[nr][nc];
                        if(s2 && s2.level === s1.level) {
                            this.merge(s1, s2);
                            return;
                        }
                    }
                }
            }
        }
        this.spawnSlime();
    }

    getEmptySlots() {
        let out = [];
        for(let r=0; r<4; r++) 
            for(let c=0; c<4; c++) 
                if(!this.gridItems[r][c]) out.push({r,c});
        return out;
    }

    setupBoard() {
        for(let r=0; r<4; r++)
            for(let c=0; c<4; c++)
                this.add.rectangle(c * 100 + 75, r * 100 + 250, 90, 90, 0x222222);
    }

    gameOver() {
        this.isGameOver = true;
        this.add.text(225, 400, 'GAME OVER', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 800,
    backgroundColor: '#111',
    parent: 'game-container',
    scene: [MenuScene, MainScene]
};

window.game = new Phaser.Game(config);
