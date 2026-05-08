// ---------- KONFIGURASI ----------
const MAX_HISTORY = 20; // Ubah angka ini sesuai keinginan (10, 15, 20, 30, atau 999 untuk unlimited)

// ---------- DATA & GLOBAL ----------
const INIT_DECK = [];
for (let i = 1; i <= 10; i++) {
    for (let j = 0; j < 4; j++) {
        INIT_DECK.push(i);
    }
}

let currentDeck = [...INIT_DECK];
let currentCards = [];
let historyCombos = [];

// DOM elements
const cardContainer = document.getElementById('cardContainer');
const shuffleBtn = document.getElementById('shuffleBtn');
const solveBtn = document.getElementById('solveBtn');
const resultMessage = document.getElementById('resultMessage');
const historyList = document.getElementById('historyList');
const solutionsContainer = document.getElementById('solutionsContainer');

let showSolutionsBtn = null;
let floatingCardsInterval = null;

// ---------- BACKGROUND ANIMASI KARTU REMI MINI ----------
const cardSuits = ['♥️', '♠️', '♦️', '♣️'];
const suitTypes = ['heart', 'spade', 'diamond', 'club'];

function createFloatingCards() {
    const container = document.getElementById('floatingCards');
    if (!container) return;
    
    // Hapus kartu lama
    container.innerHTML = '';
    
    // Buat kartu baru (40-60 kartu bergerak)
    const cardCount = 45;
    for (let i = 0; i < cardCount; i++) {
        const card = document.createElement('div');
        card.className = 'mini-card';
        
        // Pilih suit random
        const randomSuitIndex = Math.floor(Math.random() * cardSuits.length);
        const suit = cardSuits[randomSuitIndex];
        const suitType = suitTypes[randomSuitIndex];
        
        card.setAttribute('data-suit', suitType);
        card.textContent = suit;
        
        // Posisi horizontal random (0% - 100%)
        const leftPos = Math.random() * 100;
        card.style.left = `${leftPos}%`;
        
        // Ukuran bervariasi (0.7x - 1.3x dari ukuran normal)
        const scale = 0.7 + Math.random() * 0.8;
        card.style.transform = `scale(${scale})`;
        
        // Durasi animasi bervariasi (12 - 28 detik)
        const duration = 12 + Math.random() * 16;
        card.style.animationDuration = `${duration}s`;
        
        // Delay mulai bervariasi
        const delay = Math.random() * 20;
        card.style.animationDelay = `${delay}s`;
        
        // Variasi pergerakan horizontal (CSS variable)
        const moveX = (Math.random() - 0.5) * 200;
        card.style.setProperty('--move-x', `${moveX}px`);
        
        // Variasi rotasi akhir
        const rotateEnd = (Math.random() - 0.5) * 360;
        card.style.setProperty('--rotate-end', `${rotateEnd}deg`);
        
        // Opacity bervariasi
        card.style.opacity = 0.3 + Math.random() * 0.4;
        
        container.appendChild(card);
    }
}

// Refresh kartu floating setiap 25 detik
function initFloatingCardsAnimation() {
    createFloatingCards();
    
    setInterval(() => {
        createFloatingCards();
    }, 25000);
}

// ---------- UTILITY ----------
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function drawFourCards() {
    if (currentDeck.length < 4) {
        currentDeck = [...INIT_DECK];
        console.log("Dek habis, direset ulang ke 40 kartu");
        showTemporaryMessage("🔄 Dek direset! Kartu baru tersedia.", "#f4a261");
    }
    const shuffledDeck = shuffleArray([...currentDeck]);
    const drawn = shuffledDeck.slice(0, 4);
    for (let val of drawn) {
        const index = currentDeck.indexOf(val);
        if (index !== -1) currentDeck.splice(index, 1);
    }
    return drawn;
}

function showTemporaryMessage(msg, color = "#2d6a4f") {
    const originalHTML = resultMessage.innerHTML;
    resultMessage.innerHTML = `<div class="hint-icon">⏳</div><div class="hint-text">${msg}</div>`;
    resultMessage.style.borderLeftColor = color;
    setTimeout(() => {
        if (currentCards.length) {
            updateHint();
        } else {
            resultMessage.innerHTML = originalHTML;
        }
    }, 1500);
}

// Animasi kartu saat shuffle
async function animateShuffle() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('flip');
        setTimeout(() => {
            card.classList.remove('flip');
        }, 400);
    });
    await new Promise(resolve => setTimeout(resolve, 200));
}

// ---------- SOLVER CORE ----------
function evalExp(x, y, op) {
    if (op === '+') return x + y;
    if (op === '-') return x - y;
    if (op === '*') return x * y;
    if (op === '/') {
        if (y === 0) throw new Error('divide by zero');
        return x / y;
    }
    return 0;
}

function getOperatorSymbol(op) {
    if (op === '+') return '+';
    if (op === '-') return '-';
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
}

function getAllSolutions(nums) {
    const ops = ['+', '-', '*', '/'];
    const solutions = new Set();
    
    function permute(arr) {
        if (arr.length === 1) return [arr];
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = permute(rest);
            for (let p of perms) {
                result.push([arr[i], ...p]);
            }
        }
        return result;
    }
    
    const permutations = permute(nums);
    
    for (let p of permutations) {
        const [a, b, c, d] = p;
        for (let op1 of ops) {
            for (let op2 of ops) {
                for (let op3 of ops) {
                    try {
                        let step1 = evalExp(a, b, op1);
                        let step2 = evalExp(step1, c, op2);
                        let step3 = evalExp(step2, d, op3);
                        if (Math.abs(step3 - 24) < 1e-6) {
                            const expr = `((${a} ${getOperatorSymbol(op1)} ${b}) ${getOperatorSymbol(op2)} ${c}) ${getOperatorSymbol(op3)} ${d} = 24`;
                            solutions.add(expr);
                        }
                    } catch (e) {}
                    
                    try {
                        let inner = evalExp(b, c, op2);
                        let step1 = evalExp(a, inner, op1);
                        let step2 = evalExp(step1, d, op3);
                        if (Math.abs(step2 - 24) < 1e-6) {
                            const expr = `(${a} ${getOperatorSymbol(op1)} (${b} ${getOperatorSymbol(op2)} ${c})) ${getOperatorSymbol(op3)} ${d} = 24`;
                            solutions.add(expr);
                        }
                    } catch (e) {}
                    
                    try {
                        let inner1 = evalExp(b, c, op2);
                        let inner2 = evalExp(inner1, d, op3);
                        let res = evalExp(a, inner2, op1);
                        if (Math.abs(res - 24) < 1e-6) {
                            const expr = `${a} ${getOperatorSymbol(op1)} ((${b} ${getOperatorSymbol(op2)} ${c}) ${getOperatorSymbol(op3)} ${d}) = 24`;
                            solutions.add(expr);
                        }
                    } catch (e) {}
                    
                    try {
                        let left = evalExp(a, b, op1);
                        let right = evalExp(c, d, op3);
                        let res = evalExp(left, right, op2);
                        if (Math.abs(res - 24) < 1e-6) {
                            const expr = `(${a} ${getOperatorSymbol(op1)} ${b}) ${getOperatorSymbol(op2)} (${c} ${getOperatorSymbol(op3)} ${d}) = 24`;
                            solutions.add(expr);
                        }
                    } catch (e) {}
                }
            }
        }
    }
    
    return Array.from(solutions);
}

function isSolvableTo24(nums) {
    const solutions = getAllSolutions(nums);
    return solutions.length > 0;
}

// ---------- RIWAYAT dengan LIMIT FLEKSIBEL ----------
function addToHistory(cardsArray) {
    const sortedKey = [...cardsArray].sort((a, b) => a - b).join(',');
    
    const existing = historyCombos.find(item => item.key === sortedKey);
    if (existing) return;
    
    const isSolvable = isSolvableTo24(cardsArray);
    
    historyCombos.unshift({ 
        key: sortedKey, 
        cards: [...cardsArray], 
        isSolvable: isSolvable,
        timestamp: new Date().toLocaleTimeString('id-ID')
    });
    
    // Batasi riwayat sesuai MAX_HISTORY
    if (historyCombos.length > MAX_HISTORY) {
        historyCombos.pop();
    }
    
    renderHistory();
    updateHistoryCounter();
}

function renderHistory() {
    historyList.innerHTML = '';
    
    if (historyCombos.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.textContent = '✨ Belum ada kombinasi. Tekan shuffle! ✨';
        emptyLi.style.textAlign = 'center';
        emptyLi.style.color = '#888';
        emptyLi.style.padding = '20px';
        emptyLi.style.justifyContent = 'center';
        historyList.appendChild(emptyLi);
        return;
    }
    
    historyCombos.forEach((item, idx) => {
        const li = document.createElement('li');
        
        const icon = item.isSolvable ? '✅' : '❌';
        const statusText = item.isSolvable ? 'BISA 24' : 'TIDAK BISA 24';
        const color = item.isSolvable ? '#2a9d8f' : '#e63946';
        const bgColor = item.isSolvable ? 'rgba(42, 157, 143, 0.1)' : 'rgba(230, 57, 70, 0.1)';
        
        li.style.background = bgColor;
        li.style.borderLeft = `4px solid ${color}`;
        
        const leftDiv = document.createElement('div');
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        leftDiv.style.gap = '12px';
        leftDiv.style.flexWrap = 'wrap';
        
        const angkaSpan = document.createElement('span');
        angkaSpan.style.fontWeight = '700';
        angkaSpan.style.fontSize = '1rem';
        angkaSpan.style.fontFamily = 'monospace';
        angkaSpan.textContent = `🎴 ${item.cards.join(' , ')}`;
        
        const statusSpan = document.createElement('span');
        statusSpan.style.background = color;
        statusSpan.style.color = 'white';
        statusSpan.style.padding = '4px 12px';
        statusSpan.style.borderRadius = '30px';
        statusSpan.style.fontSize = '0.7rem';
        statusSpan.style.fontWeight = '700';
        statusSpan.textContent = `${icon} ${statusText}`;
        
        leftDiv.appendChild(angkaSpan);
        leftDiv.appendChild(statusSpan);
        
        const rightDiv = document.createElement('div');
        rightDiv.style.display = 'flex';
        rightDiv.style.alignItems = 'center';
        rightDiv.style.gap = '12px';
        
        const timeSpan = document.createElement('span');
        timeSpan.style.color = '#aaa';
        timeSpan.style.fontSize = '0.65rem';
        timeSpan.style.fontFamily = 'monospace';
        timeSpan.textContent = item.timestamp || '';
        
        const numberSpan = document.createElement('span');
        numberSpan.style.color = '#888';
        numberSpan.style.fontSize = '0.7rem';
        numberSpan.textContent = `#${idx + 1}`;
        
        rightDiv.appendChild(timeSpan);
        rightDiv.appendChild(numberSpan);
        
        li.appendChild(leftDiv);
        li.appendChild(rightDiv);
        
        historyList.appendChild(li);
    });
}

function updateHistoryCounter() {
    let counter = document.getElementById('historyCounter');
    if (!counter) {
        const historyHeader = document.querySelector('.history-header');
        if (historyHeader) {
            counter = document.createElement('span');
            counter.id = 'historyCounter';
            historyHeader.appendChild(counter);
        }
    }
    if (counter) {
        const limitText = MAX_HISTORY >= 999 ? '∞' : MAX_HISTORY;
        counter.textContent = `${historyCombos.length}/${limitText}`;
    }
}

// Fungsi untuk menghapus semua riwayat
function clearHistory() {
    if (confirm(`Hapus semua ${historyCombos.length} riwayat?`)) {
        historyCombos = [];
        renderHistory();
        updateHistoryCounter();
        updateHintMessage('🗑️ Riwayat berhasil dihapus!', '#f4a261');
    }
}

// Fungsi untuk menambah tombol clear history
function addClearHistoryButton() {
    const historyHeader = document.querySelector('.history-header');
    if (!historyHeader) return;
    
    let clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) return;
    
    clearBtn = document.createElement('button');
    clearBtn.id = 'clearHistoryBtn';
    clearBtn.innerHTML = '🗑️ Hapus Riwayat';
    clearBtn.onclick = clearHistory;
    
    historyHeader.appendChild(clearBtn);
}

// ---------- TAMPILKAN SOLUSI ----------
function displayAllSolutions() {
    if (!currentCards.length) {
        updateHintMessage('❌ Tidak ada kartu aktif!', '#e63946');
        return;
    }
    
    const solutions = getAllSolutions(currentCards);
    
    if (solutions.length === 0) {
        updateHintMessage(`❌ Kombinasi ${currentCards.join(', ')} TIDAK bisa mencapai 24.`, '#e63946');
        if (showSolutionsBtn) showSolutionsBtn.style.opacity = '0.5';
        return;
    }
    
    solutionsContainer.innerHTML = '';
    solutionsContainer.style.display = 'block';
    
    const title = document.createElement('h3');
    title.innerHTML = `📋 Semua Solusi untuk <span style="font-family: monospace;">${currentCards.join(', ')}</span> <span style="background: #2d6a4f; color: white; padding: 2px 10px; border-radius: 30px; font-size: 0.8rem;">${solutions.length} cara</span>`;
    title.style.marginBottom = '16px';
    solutionsContainer.appendChild(title);
    
    const list = document.createElement('ul');
    
    solutions.forEach((sol, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `${idx + 1}. ${sol}`;
        list.appendChild(li);
    });
    
    solutionsContainer.appendChild(list);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖ Tutup';
    closeBtn.style.marginTop = '16px';
    closeBtn.style.padding = '10px 24px';
    closeBtn.style.background = '#e63946';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '40px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = '600';
    closeBtn.style.transition = 'all 0.2s';
    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.02)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
    closeBtn.onclick = () => {
        solutionsContainer.style.display = 'none';
    };
    solutionsContainer.appendChild(closeBtn);
    
    updateHintMessage(`✅ Menampilkan ${solutions.length} cara mencapai 24!`, '#2a9d8f');
}

// ---------- HINT ----------
function updateHintMessage(msg, color = '#f4a261') {
    resultMessage.innerHTML = `<div class="hint-icon">💡</div><div class="hint-text">${msg}</div>`;
    resultMessage.style.borderLeftColor = color;
}

function updateHint() {
    if (!currentCards.length) {
        updateHintMessage('🎴 Tekan shuffle untuk mulai bermain!', '#f4a261');
        if (showSolutionsBtn) {
            showSolutionsBtn.style.opacity = '0.5';
            showSolutionsBtn.disabled = true;
        }
        return;
    }
    
    const bisa = isSolvableTo24(currentCards);
    if (bisa) {
        updateHintMessage(`✨ Kombinasi ${currentCards.join(', ')} BISA mencapai 24! Coba cari sendiri ya. ✨`, '#2a9d8f');
        if (showSolutionsBtn) {
            showSolutionsBtn.style.opacity = '1';
            showSolutionsBtn.disabled = false;
        }
    } else {
        updateHintMessage(`😢 Kombinasi ${currentCards.join(', ')} TIDAK BISA mencapai 24. Shuffle lagi!`, '#e63946');
        if (showSolutionsBtn) {
            showSolutionsBtn.style.opacity = '0.5';
            showSolutionsBtn.disabled = true;
        }
        if (solutionsContainer) solutionsContainer.style.display = 'none';
    }
}

function createShowSolutionsButton() {
    const buttonsDiv = document.querySelector('.button-group');
    if (!buttonsDiv) return null;
    
    let existingBtn = document.getElementById('showSolutionsBtn');
    if (existingBtn) return existingBtn;
    
    const btn = document.createElement('button');
    btn.id = 'showSolutionsBtn';
    btn.className = 'btn';
    btn.style.background = 'linear-gradient(135deg, #f4a261, #e76f51)';
    btn.style.color = 'white';
    btn.innerHTML = '<span class="btn-icon">🔍</span><span>Lihat Semua Jalan</span>';
    btn.onclick = displayAllSolutions;
    buttonsDiv.appendChild(btn);
    return btn;
}

// ---------- GAME FLOW ----------
async function shuffleNewCards() {
    const wrapper = document.querySelector('.cards-wrapper');
    wrapper.classList.add('shuffling');
    
    await animateShuffle();
    
    const newCards = drawFourCards();
    currentCards = newCards;
    renderCards();
    
    wrapper.classList.remove('shuffling');
    
    if (solutionsContainer) solutionsContainer.style.display = 'none';
    
    updateHint();
    addToHistory([...currentCards]);
}

function onSolve() {
    if (!currentCards.length) {
        updateHintMessage('❌ Belum ada kartu, tekan shuffle dulu!', '#e63946');
        return;
    }
    
    const bisa = isSolvableTo24(currentCards);
    if (bisa) {
        updateHintMessage(`🎉 SELAMAT! 🎉 Dari ${currentCards.join(', ')} bisa dibuat 24!`, '#2a9d8f');
        triggerConfetti();
    } else {
        updateHintMessage(`😢 Sayang sekali, ${currentCards.join(', ')} TIDAK bisa mencapai 24. Coba shuffle lagi!`, '#e63946');
    }
}

function triggerConfetti() {
    const colors = ['#2d6a4f', '#f4a261', '#e76f51', '#2a9d8f', '#e63946'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.animation = `fall ${Math.random() * 2 + 1}s linear forwards`;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2000);
    }
}

function renderCards() {
    cardContainer.innerHTML = '';
    currentCards.forEach(value => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        const span = document.createElement('span');
        span.textContent = value;
        cardDiv.appendChild(span);
        cardContainer.appendChild(cardDiv);
    });
}

// ---------- INIT GAME ----------
function initGame() {
    currentDeck = shuffleArray([...INIT_DECK]);
    const firstCards = drawFourCards();
    currentCards = firstCards;
    renderCards();
    
    showSolutionsBtn = createShowSolutionsButton();
    addClearHistoryButton();
    
    updateHint();
    updateHistoryCounter();
    
    // Tampilkan limit maks di HTML
    const limitSpan = document.getElementById('maxHistoryLimit');
    if (limitSpan) {
        limitSpan.textContent = MAX_HISTORY >= 999 ? '∞ (unlimited)' : MAX_HISTORY;
    }
    
    historyCombos = [];
    renderHistory();
    addToHistory(currentCards);
    
    // Inisialisasi background animasi kartu remi mini
    initFloatingCardsAnimation();
}

// Event listeners
shuffleBtn.addEventListener('click', shuffleNewCards);
solveBtn.addEventListener('click', onSolve);

// Jalankan game
initGame();