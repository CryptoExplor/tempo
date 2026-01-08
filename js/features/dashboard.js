// Dashboard Feature
FeatureRegistry.register({
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    order: 1,

    render() {
        return `
            <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white mb-6">
                <h2 class="text-3xl font-bold mb-2">Welcome to Tempo Bot</h2>
                <p class="text-purple-100">Your all-in-one DeFi automation platform</p>
            </div>
            <div id="balancesGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
        `;
    },

    async init() {
        await this.loadBalances();
    },

    async loadBalances() {
        const grid = document.getElementById('balancesGrid');
        UI.showLoading('balancesGrid', 'Loading balances...');

        try {
            grid.innerHTML = '';
            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                const { formatted } = await TempoApp.getTokenBalance(address);
                grid.innerHTML += UI.createCard(symbol, parseFloat(formatted).toFixed(2));
            }
        } catch (error) {
            UI.showStatus(`Error loading balances: ${error.message}`, 'error');
        }
    }
});