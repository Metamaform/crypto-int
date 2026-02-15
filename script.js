const tg = window.Telegram.WebApp;
tg.expand();
tg.headerColor = '#05070a';

// Переключение вкладок
function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('tab-' + page).classList.add('active');
    
    const indicator = document.querySelector('.active-indicator');
    indicator.style.left = page === 'trade' ? '4px' : 'calc(50% + 0px)';
    
    tg.HapticFeedback.impactOccurred('light');
}

// Логика Калькулятора
let amountInput = document.getElementById('trade-amount');
let feeInput = document.getElementById('trade-fee');
let resultDisplay = document.getElementById('net-result');

function numPress(key) {
    if (key === 'C') {
        amountInput.value = '';
    } else {
        amountInput.value += key;
    }
    updateCalculation();
    tg.HapticFeedback.selectionChanged();
}

function updateCalculation() {
    const amount = parseFloat(amountInput.value) || 0;
    const fee = parseFloat(feeInput.value) || 0;
    const net = amount - (amount * (fee / 100));
    
    resultDisplay.innerText = net.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
}

// Поле комиссии тоже обновляет результат
feeInput.addEventListener('input', updateCalculation);

// LIVE Market с лоудером
async function fetchMarketData() {
    const eco = document.getElementById('eco-select').value;
    const loader = document.getElementById('loader');
    const results = document.getElementById('market-results');
    
    if (!eco) return;

    loader.style.display = 'flex';
    results.innerHTML = '';

    // Имитация задержки сети для красоты лоудера
    setTimeout(() => {
        loader.style.display = 'none';
        
        const mockData = {
            ton: [
                { name: 'STON.fi', price: '5.24', url: 'https://ston.fi' },
                { name: 'DeDust', price: '5.22', url: 'https://dedust.io' }
            ],
            solana: [
                { name: 'Jupiter', price: '142.10', url: 'https://jup.ag' },
                { name: 'Raydium', price: '141.85', url: 'https://raydium.io' }
            ],
            eth: [
                { name: 'Uniswap', price: '2645.00', url: 'https://uniswap.org' }
            ]
        };

        const data = mockData[eco] || [];
        results.innerHTML = data.map(m => 
            <div class="market-card">
                <div>
                    <div style="font-size: 12px; color: #888;">${m.name}</div>
                    <div style="font-size: 18px; font-weight: bold;">$${m.price}</div>
                </div>
                <a href="${m.url}" target="_blank" class="exchange-link">TRADE</a>
            </div>
        ).join('');
        
        tg.HapticFeedback.notificationOccurred('success');
    }, 1500);
}
