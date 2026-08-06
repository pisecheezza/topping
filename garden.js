document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('secret-trigger')?.addEventListener('click', () => {
    window.mazeGame.toggleGame();
  });
});

class MazeGame {
    constructor() {
        this.SIZE = 15;
        this.mazeMap = [];
        this.player = { x: 0, y: 0 };
        this.enemyPos = { x: 0, y: 0 };
        this.goalPos = { x: 0, y: 0 };
        this.isActive = false;
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
    }

    setupDOM() {
        // 플로팅 버튼과 게임 팝오버 가져오기
        this.gamePopover = document.getElementById('gamePopover');
        this.gridContainer = document.getElementById('gridMaze');
        this.restartBtn = document.getElementById('btn-restart');
        this.toastMessage = document.getElementById('toastMessage');
    }

    setupEventListeners() {;
        this.restartBtn?.addEventListener('click', () => this.generateNew());
        
        const directions = {
            'move-up': [0, -1],
            'move-down': [0, 1],
            'move-left': [-1, 0],
            'move-right': [1, 0]
        };

        Object.entries(directions).forEach(([id, [dx, dy]]) => {
            document.getElementById(id)?.addEventListener('click', () => this.move(dx, dy));
        });

        window.addEventListener('keydown', (e) => {
            const keyMap = {
                'ArrowUp': [0, -1],
                'ArrowDown': [0, 1],
                'ArrowLeft': [-1, 0],
                'ArrowRight': [1, 0]
            };
            if (keyMap[e.key]) {
                e.preventDefault();
                this.move(...keyMap[e.key]);
            }
        });
    }

    toggleGame() {
        this.gamePopover.classList.toggle('active');
        if (this.gamePopover.classList.contains('active')) {
            this.generateNew();
        }
    }

    generateNew() {
        this.generateProceduralMaze();
        this.player = { x: 0, y: 0 };
        this.placeEnemy();
        this.render();
    }

    generateProceduralMaze() {
        while (true) {
            const map = Array.from({ length: this.SIZE }, () => Array(this.SIZE).fill(1));

            const carve = (x, y) => {
                map[y][x] = 0;
                [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5)
                    .forEach(([dx, dy]) => {
                        const [nx, ny] = [x + dx, y + dy];
                        if (nx >= 0 && nx < this.SIZE && ny >= 0 && ny < this.SIZE && map[ny][nx] === 1) {
                            map[y + dy / 2][x + dx / 2] = 0;
                            carve(nx, ny);
                        }
                    });
            };

            carve(0, 0);
            map[0][0] = 0;

            // 벽에 구멍 뚫기
            for (let i = 1; i < this.SIZE - 1; i++) {
                for (let j = 1; j < this.SIZE - 1; j++) {
                    if (map[i][j] === 1 && Math.random() < 0.12) {
                        map[i][j] = 0;
                    }
                }
            }

            // 목표 위치 찾기
            const goals = [];
            for (let r = this.SIZE - 4; r < this.SIZE; r++) {
                for (let c = this.SIZE - 4; c < this.SIZE; c++) {
                    if (map[r][c] === 0) goals.push({ r, c });
                }
            }

            if (goals.length > 0) {
                const goal = goals[Math.floor(Math.random() * goals.length)];
                this.goalPos = { x: goal.c, y: goal.r };
                map[goal.r][goal.c] = 2;
                this.mazeMap = map;
                break;
            }
        }
    }
    placeEnemy() {
    const candidates = [];
    for (let r = 0; r < this.SIZE; r++) {
        for (let c = 0; c < this.SIZE; c++) {
            if (this.mazeMap[r][c] !== 1) {
                const dist = Math.abs(r - this.player.y) + Math.abs(c - this.player.x);
                if (dist >= this.SIZE) candidates.push({ x: c, y: r });
            }
        }
    }
    if (candidates.length === 0) {
        // 후보 없으면 골 위치 근처로 폴백
        this.enemyPos = { x: this.goalPos.x, y: this.goalPos.y };
    } else {
        this.enemyPos = candidates[Math.floor(Math.random() * candidates.length)];
    }
}

getNextStepTowardPlayer() {
    const start = this.enemyPos;
    const target = this.player;
    if (start.x === target.x && start.y === target.y) return start;

    const key = (x, y) => `${x},${y}`;
    const visited = new Set([key(start.x, start.y)]);
    const queue = [{ x: start.x, y: start.y, path: [] }];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (queue.length > 0) {
        const cur = queue.shift();
        if (cur.x === target.x && cur.y === target.y) {
            return cur.path.length > 0 ? cur.path[0] : start;
        }
        for (const [dx, dy] of dirs) {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (nx >= 0 && nx < this.SIZE && ny >= 0 && ny < this.SIZE &&
                this.mazeMap[ny][nx] !== 1 && !visited.has(key(nx, ny))) {
                visited.add(key(nx, ny));
                queue.push({ x: nx, y: ny, path: [...cur.path, { x: nx, y: ny }] });
            }
        }
    }
    return start; // 경로 없으면 제자리
}
    render() {
    this.gridContainer.innerHTML = '';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.SIZE}, 18px)`;

    for (let r = 0; r < this.SIZE; r++) {
        for (let c = 0; c < this.SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (this.mazeMap[r][c] === 1) {
                cell.classList.add('wall');
            } else if (r === this.player.y && c === this.player.x) {
                cell.innerHTML = '🦋';
            } else if (r === this.enemyPos.y && c === this.enemyPos.x) {
                cell.innerHTML = '🌹';
            } else if (this.mazeMap[r][c] === 2) {
                cell.classList.add('goal');
                cell.innerHTML = '🐰';
            }

            this.gridContainer.appendChild(cell);
        }
    }
}

    move(dx, dy) {
    if (!this.gamePopover.classList.contains('active')) return;

    const [nx, ny] = [this.player.x + dx, this.player.y + dy];

    if (nx >= 0 && nx < this.SIZE && ny >= 0 && ny < this.SIZE &&
        this.mazeMap[ny][nx] !== 1) {
        this.player = { x: nx, y: ny };

       if (this.mazeMap[ny][nx] === 2) {
            this.render();
            this.showToast('ツカマエタ!', '🐰'); // 토끼 아이콘 전달
            setTimeout(() => this.generateNew(), 600);
            return;
        }

        this.enemyPos = this.getNextStepTowardPlayer();
        this.render();

        if (this.enemyPos.x === this.player.x && this.enemyPos.y === this.player.y) {
            this.showToast('バラに捕まってしまいました……', '🌹'); // 장미 아이콘 전달
            setTimeout(() => this.generateNew(), 800);
        }
    }
}

/*    showToast(message) {
        this.toastMessage.textContent = message;
        this.toastMessage.classList.add('show');
        setTimeout(() => this.toastMessage.classList.remove('show'), 1200);
    }
} */
  
   showToast(message, icon = '🐰') {
    // 아이콘 요소와 텍스트 요소를 각각 찾아 변경합니다.
    const iconElement = this.toastMessage.querySelector('.toast-icon');
    const textElement = this.toastMessage.querySelector('.toast-text');
    
    if (iconElement) {
        iconElement.textContent = icon;
    }
    if (textElement) {
        textElement.textContent = message;
    }
    
    this.toastMessage.classList.add('show');
    setTimeout(() => this.toastMessage.classList.remove('show'), 1200);
}


// 게임 시작
window.mazeGame = new MazeGame();
