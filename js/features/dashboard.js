// Migration Info Dashboard Enhancement
// Add this to dashboard.js or create as separate feature

FeatureRegistry.register({
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    order: 1,

    render() {
        return `
            <!-- Network Status Banner -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-5xl">🚀</div>
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2">Welcome to Tempo Moderato</h2>
                        <p class="text-blue-100">The latest Tempo testnet (Chain ID: ${CONFIG.CHAIN_ID})</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div class="bg-white bg-opacity-20 rounded-lg p-3">
                        <div class="text-xs text-blue-100 mb-1">Network Version</div>
                        <div class="font-bold">${CONFIG.NETWORK_VERSION}</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-3">
                        <div class="text-xs text-blue-100 mb-1">Launched</div>
                        <div class="font-bold">${CONFIG.LAUNCH_DATE}</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-3">
                        <div class="text-xs text-blue-100 mb-1">Status</div>
                        <div class="font-bold">✅ Active</div>
                    </div>
                </div>
            </div>

            <!-- Migration Notice (if applicable) -->
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                <div class="flex items-start gap-3">
                    <div class="text-2xl">ℹ️</div>
                    <div class="flex-1">
                        <h3 class="font-bold text-yellow-900 mb-2">Network Migration Information</h3>
                        <p class="text-sm text-yellow-800 mb-3">
                            Tempo launched <strong>Moderato testnet</strong> on January 8th, 2025 to replace Andantino. 
                            If you have contracts on Andantino, they must be redeployed here.
                        </p>
                        <div class="flex flex-wrap gap-2">
                            <a href="${CONFIG.EXPLORER_URL}" target="_blank" 
                               class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg font-semibold">
                                View Explorer
                            </a>
                            <a href="https://docs.tempo.xyz/network-upgrades" target="_blank" 
                               class="text-xs bg-white hover:bg-gray-50 text-yellow-900 px-3 py-1.5 rounded-lg font-semibold border border-yellow-300">
                                Migration Guide
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Token Balances -->
            <h3 class="text-xl font-bold text-gray-800 mb-4">Your Token Balances</h3>
            <div id="balancesGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>

            <!-- Quick Actions -->
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onclick="FeatureRegistry.showFeature('faucet')" 
                            class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-semibold transition-all">
                        💧 Get Faucet
                    </button>
                    <button onclick="FeatureRegistry.showFeature('swap')" 
                            class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg font-semibold transition-all">
                        🔄 Swap
                    </button>
                    <button onclick="FeatureRegistry.showFeature('send')" 
                            class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-semibold transition-all">
                        📤 Send
                    </button>
                    <button onclick="FeatureRegistry.showFeature('create')" 
                            class="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-semibold transition-all">
                        🪙 Create Token
                    </button>
                </div>
            </div>

            <!-- Network Details -->
            <div class="mt-6 bg-white rounded-xl p-6 border border-gray-200">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Network Configuration</h3>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between items-center py-2 border-b">
                        <span class="text-gray-600">RPC URL</span>
                        <code class="bg-gray-100 px-3 py-1 rounded text-xs">${CONFIG.RPC_URL}</code>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b">
                        <span class="text-gray-600">Chain ID</span>
                        <code class="bg-gray-100 px-3 py-1 rounded text-xs">${CONFIG.CHAIN_ID}</code>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b">
                        <span class="text-gray-600">Chain ID (Hex)</span>
                        <code class="bg-gray-100 px-3 py-1 rounded text-xs">${CONFIG.CHAIN_ID_HEX}</code>
                    </div>
                    <div class="flex justify-between items-center py-2">
                        <span class="text-gray-600">Explorer</span>
                        <a href="${CONFIG.EXPLORER_URL}" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs">
                            ${CONFIG.EXPLORER_URL} →
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadBalances();
    },

async loadBalances() {
    const grid = document.getElementById('balancesGrid');

    // ⛔ Dashboard not mounted yet
    if (!grid) {
        console.warn('[Dashboard] balancesGrid not found — skipping loadBalances');
        return;
    }

    UI.showLoading('balancesGrid', 'Loading balances...');

    try {
        grid.innerHTML = '';

        for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
            const { formatted } = await TempoApp.getTokenBalance(address);

            grid.innerHTML += UI.createCard(
                symbol,
                Number(formatted).toFixed(2)
            );
        }
    } catch (error) {
        UI.showStatus(`Error loading balances: ${error.message}`, 'error');
        console.error('[Dashboard] loadBalances failed:', error);
    }
}
});
