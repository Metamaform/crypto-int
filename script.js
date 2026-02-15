const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// --- STATE MANAGEMENT ---
const state = {
    currentTab: 'calc',
    expression: '',
    lastResult: null
};

// --- NAVIGATION LOGIC ---
function switchTab(targetId) {
    if (state.currentTab === targetId) return;

    const currentEl = document.getElementById(state.currentTab);
    const nextEl = document.getElementById(targetId);
    const indicator = document.querySelector('.nav-indicator');
    
    // Анимация индикатора
    indicator.style.transform = targetId === 'calc' ? 'translateX(0)' : 'translateX(100%)';
    
    // Анимация страниц
    if (targetId === 'crypto') {
        currentEl.className = 'page prev-page';
        nextEl.className = 'page active-page';
        crypto.fetch(); // Авто-обновление при входе
    } else {
        currentEl.className = 'page next-page';
        nextEl.className = 'page active-page';
    }

    // Обновляем состояние кнопок
    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.target === targetId);
    });

    state.currentTab = targetId;
    tg.HapticFeedback.impactOccurred('light');
}

// --- SECURE CALCULATOR ---
const actions = {
    display: document.getElementById('display'),
    history: document.getElementById('history'),
    
    append(char) {
        if (state.expression.length > 15) return; // Limit length
        
        // Предотвращение дублирования операторов
        const lastChar = state.expression.slice(-1);
        if (['+', '-', '*', '/', '.'].includes(char) && ['+', '-', '*', '/', '.'].includes(lastChar)) {
            state.expression = state.expression.slice(0, -1) + char;
        } else {
            state.expression += char;
        }
        
        this.updateView();
        tg.HapticFeedback.selectionChanged();
    },
    
    clear() {
        state.expression = '';
        state.lastResult = null;
        this.updateView();
        tg.HapticFeedback.impactOccurred('medium');
    },
    
    delete() {
        state.expression = state.expression.toString().slice(0, -1);
        this.updateView();
        tg.HapticFeedback.selectionChanged();
    },
    
    calculate() {
        if (!state.expression) return;
        
        try {
            // SECURITY FIX: Вместо eval используем Function с валидацией
            // Разрешаем только цифры и мат. знаки
            if (/[^0-9+\-*/.%]/.test(state.expression)) {
                throw new Error("Invalid Input");
            }
            
            // Безопасное выполнение
            const safeMath = new Function('return ' + state.expression);
            const result = safeMath();
            
            if (!isFinite(result) || isNaN(result)) throw new Error("Error");
            
            this.history.innerText = state.expression + ' =';
            state.expression = String(parseFloat(result.toFixed(6))); // Округляем до 6 знаков
            this.updateView();
            tg.HapticFeedback.notificationOccurred('success');
            
        } catch (e) {
            this.display.innerText = 'Error';
            state.expression = '';
            tg.HapticFeedback.notificationOccurred('error');
        }
    },
    
    updateView() {
        this.display.innerText = state.expression || '0';
        // Динамический размер шрифта
        if (state.expression.length > 9) this.display.style.fontSize = '32px';
        else this.display.style.fontSize = '48px';
    }
};

// --- CRYPTO LOGIC (Aggregator Simulation) ---
const crypto = {
    container: document.getElementById('crypto-list'),
    
    async fetch() {
        const coin = document.getElementById('coin-select').value;
        this.showLoading();
        
        try {
            // Реальный запрос к CoinGecko
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
            const data = await res.json();
            
            if(!data[coin]) throw new Error("No data");
            
            const basePrice = data[coin].usd;
            this.renderOffers(basePrice);
            tg.HapticFeedback.notificationOccurred('success');
            
        } catch (e) {
            this.container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px">Failed to load rates.<br>Try again later.</div>`;
        }
    },
    
    showLoading() {
        this.container.innerHTML = `
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
        `;
    },
    
    renderOffers(basePrice) {
        // Симуляция спреда разных бирж
        const exchanges = [
            { name: 'Binance P2P', spread: 1.001 },
            { name: 'Bybit Spot', spread: 1.0005 },
            { name: 'Telegram Wallet', spread: 1.003 },
            { name: 'OKX', spread: 1.002 }
        ];
        
        // Генерация цен и сортировка (лучшая цена - наименьшая для покупки)
        const offers = exchanges.map(ex => ({
            name: ex.name,
            price: (basePrice * ex.spread).toFixed(2)
        })).sort((a, b) => a.price - b.price);
        
        let html = '';
        offers.forEach((offer, idx) => {
            const isBest = idx === 0;
            html += `
                <div class="rate-card ${isBest ? 'best' : ''}">
                    <div class="ex-info">
                        <div style="font-weight:600; font-size:15px">${offer.name}</div>
                        ${isBest ? '<span style="color:var(--success); font-size:12px">Best Price 🔥</span>' : ''}
                    </div>
                    <div style="font-weight:700; font-size:18px">$${offer.price}</div>
                </div>
            `;
        });
        
        this.container.innerHTML = html;
    }
};