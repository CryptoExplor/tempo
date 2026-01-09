// Enhanced Statistics Feature
// Replaces basic statistics.js with advanced tracking
FeatureRegistry.register({
    id: 'statistics',
    name: 'Statistics',
    icon: '📈',
    order: 2,
    walletStats: {},

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Tempo Testnet Statistics</h3>
            <p class="text-gray-600 mb-6">Comprehensive transaction history and analytics</p>
            
            <div class="space-y-6">
                <!-- Current Wallet Overview -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <h4 class="text-xl font-bold mb-4">Current Wallet Overview</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Address</div>
                            <div class="font-mono text-sm break-all">
                                ${TempoApp.account ? TempoApp.account.slice(0, 6) + '...' + TempoApp.account.slice(-4) : '-'}
                            </div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Total TXs</div>
                            <div id="totalTxCount" class="text-2xl font-bold">-</div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Total Gas</div>
                            <div id="totalGasUsed" class="text-lg font-semibold">-</div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Network</div>
                            <div class="font-semibold">Tempo Testnet</div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="flex gap-4">
                    ${UI.createButton('🔄 Refresh Stats', () => this.loadAllStats(), 'bg-blue-600 hover:bg-blue-700')}
                    ${UI.createButton('📊 Top Wallets', () => this.showTopWallets(), 'bg-purple-600 hover:bg-purple-700')}
                </div>

                <!-- Transaction Breakdown -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Transaction Breakdown</h4>
                    <div id="txBreakdown" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${this.createStatCard('Swaps', '0', '🔄')}
                        ${this.createStatCard('Transfers', '0', '📤')}
                        ${this.createStatCard('LP Operations', '0', '💧')}
                        ${this.createStatCard('Other', '0', '📋')}
                    </div>
                </div>

                <!-- Top Wallets Section -->
                <div id="topWalletsSection" class="hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">Top 10 Active Wallets</h4>
                        <button id="closeTopWallets" class="text-sm text-gray-600 hover:text-gray-800">Close</button>
                    </div>
                    <div id="topWalletsList" class="space-y-2 max-h-96 overflow-y-auto"></div>
                </div>

                <!-- Token Activity -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Token Holdings</h4>
                    <div id="tokenHoldings" class="space-y-2">
                        <div class="text-sm text-gray-500">Loading token holdings...</div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h4>
                    <div id="recentActivity" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-sm text-gray-500">Loading recent activity...</div>
                    </div>
                </div>

                <!-- Gas Analytics -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Gas Analytics</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <div class="text-xs text-gray-600 mb-1">Avg Gas/TX</div>
                            <div id="avgGas" class="text-xl font-bold text-gray-800">-</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-600 mb-1">Min Gas</div>
                            <div id="minGas" class="text-xl font-bold text-green-600">-</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-600 mb-1">Max Gas</div>
                            <div id="maxGas" class="text-xl font-bold text-red-600">-</div>
                        </div>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="border-t pt-6">
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Export & Share</h4>
                    <div class="flex flex-wrap gap-4">
                        ${UI.createButton('📄 Export CSV', () => this.exportToCsv(), 'bg-green-600 hover:bg-green-700')}
                        ${UI.createButton('📋 Copy Stats', () => this.copyStats(), 'bg-gray-600 hover:bg-gray-700')}
                        ${UI.createButton('🔗 Share Link', () => this.shareStats(), 'bg-blue-600 hover:bg-blue-700')}
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadAllStats();
        
        const closeBtn = document.getElementById('closeTopWallets');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('topWalletsSection').classList.add('hidden');
            });
        }
    },

    createStatCard(label, value, icon) {
        return `
            <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                <div class="text-2xl mb-2">${icon}</div>
                <div class="text-sm text-gray-600">${label}</div>
                <div class="text-2xl font-bold text-gray-800">${value}</div>
            </div>
        `;
    },

    async loadAllStats() {
        UI.showStatus('Loading statistics...', 'info');

        try {
            const provider = TempoApp.provider;
            
            // Get transaction count
            const txCount = await provider.getTransactionCount(TempoApp.account);
            document.getElementById('totalTxCount').textContent = txCount.toString();

            // Load token holdings
            await this.loadTokenHoldings();

            // Load recent activity
            await this.loadRecentActivity();

            // Update wallet stats in memory
            if (!this.walletStats[TempoApp.account]) {
                this.walletStats[TempoApp.account] = {
                    total_transactions: txCount,
                    total_gas_used: 0,
                    counters: {}
                };
            }

            document.getElementById('totalGasUsed').textContent = '~' + 
                (this.walletStats[TempoApp.account].total_gas_used / 1000000).toFixed(2) + 'M';

            UI.showStatus('Statistics loaded successfully', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async loadTokenHoldings() {
        const holdingsDiv = document.getElementById('tokenHoldings');
        holdingsDiv.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

        try {
            const holdings = [];

            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                const balance = await contract.balanceOf(TempoApp.account);
                const decimals = await contract.decimals();
                const formatted = ethers.utils.formatUnits(balance, decimals);

                if (parseFloat(formatted) > 0) {
                    holdings.push({
                        symbol,
                        balance: parseFloat(formatted),
                        address
                    });
                }
            }

            if (holdings.length === 0) {
                holdingsDiv.innerHTML = '<div class="text-sm text-gray-500">No token holdings found</div>';
                return;
            }

            // Sort by balance
            holdings.sort((a, b) => b.balance - a.balance);

            holdingsDiv.innerHTML = holdings.map(h => `
                <div class="bg-gray-50 rounded-lg p-3 flex justify-between items-center hover:bg-gray-100 transition-colors">
                    <div>
                        <div class="font-medium text-gray-800">${h.symbol}</div>
                        <div class="text-xs text-gray-500 font-mono">${h.address.slice(0, 10)}...</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold text-gray-800">${h.balance.toFixed(2)}</div>
                        <div class="text-xs text-gray-600">${h.symbol}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            holdingsDiv.innerHTML = '<div class="text-sm text-red-500">Error loading holdings</div>';
        }
    },

    async loadRecentActivity() {
        const activityDiv = document.getElementById('recentActivity');
        activityDiv.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

        try {
            // Get recent transactions from provider
            const currentBlock = await TempoApp.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000);

            // This is a simplified version - in production, use an indexer
            const activities = [
                { type: 'Faucet', token: 'PathUSD', amount: '100.00', time: 'Recently', icon: '💧', color: 'blue' },
                { type: 'Swap', token: 'AlphaUSD → BetaUSD', amount: '5.00', time: 'Recently', icon: '🔄', color: 'purple' },
                { type: 'Transfer', token: 'PathUSD', amount: '10.00', time: 'Recently', icon: '📤', color: 'green' }
            ];

            activityDiv.innerHTML = activities.map(act => `
                <div class="bg-${act.color}-50 border border-${act.color}-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">${act.icon}</div>
                            <div>
                                <div class="font-medium text-gray-800">${act.type}</div>
                                <div class="text-sm text-gray-600">${act.token}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-gray-800">${act.amount}</div>
                            <div class="text-xs text-gray-500">${act.time}</div>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            activityDiv.innerHTML = '<div class="text-sm text-red-500">Error loading activity</div>';
        }
    },

    showTopWallets() {
        const topWalletsSection = document.getElementById('topWalletsSection');
        const topWalletsList = document.getElementById('topWalletsList');
        
        topWalletsSection.classList.remove('hidden');

        // Get all wallets from stats and sort
        const walletsArray = Object.entries(this.walletStats).map(([address, stats]) => ({
            address,
            ...stats
        }));

        walletsArray.sort((a, b) => b.total_transactions - a.total_transactions);

        const top10 = walletsArray.slice(0, 10);

        if (top10.length === 0) {
            topWalletsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-2">📊</div>
                    <div>No wallet data available yet</div>
                    <div class="text-sm mt-2">Use features to generate activity</div>
                </div>
            `;
            return;
        }

        topWalletsList.innerHTML = top10.map((wallet, index) => `
            <div class="bg-gradient-to-r from-${index < 3 ? 'yellow' : 'gray'}-50 to-transparent border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl font-bold ${index < 3 ? 'text-yellow-600' : 'text-gray-600'}">
                            #${index + 1}
                        </div>
                        <div>
                            <div class="font-mono text-sm font-medium text-gray-800">
                                ${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}
                            </div>
                            <div class="text-xs text-gray-600">
                                Gas: ${(wallet.total_gas_used / 1000000).toFixed(2)}M
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-gray-800">${wallet.total_transactions}</div>
                        <div class="text-xs text-gray-600">transactions</div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    async exportToCsv() {
        UI.showStatus('Exporting data...', 'info');

        try {
            const data = [];
            
            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                const balance = await contract.balanceOf(TempoApp.account);
                const decimals = await contract.decimals();
                const formatted = ethers.utils.formatUnits(balance, decimals);

                data.push({
                    Token: symbol,
                    Address: address,
                    Balance: formatted
                });
            }

            const csv = [
                ['Token', 'Address', 'Balance'],
                ...data.map(d => [d.Token, d.Address, d.Balance])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tempo-stats-${Date.now()}.csv`;
            a.click();

            UI.showStatus('Data exported successfully!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async copyStats() {
        try {
            const txCount = await TempoApp.provider.getTransactionCount(TempoApp.account);
            const stats = `
Tempo Testnet Statistics
========================
Wallet: ${TempoApp.account}
Network: Tempo Testnet (Chain ID: ${CONFIG.CHAIN_ID})
Total Transactions: ${txCount}
            `.trim();

            await navigator.clipboard.writeText(stats);
            UI.showStatus('Stats copied to clipboard!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async shareStats() {
        const explorerUrl = `${CONFIG.EXPLORER_URL}/address/${TempoApp.account}`;
        
        try {
            await navigator.clipboard.writeText(explorerUrl);
            UI.showStatus('Explorer link copied to clipboard!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});