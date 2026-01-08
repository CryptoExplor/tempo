// Statistics Feature
FeatureRegistry.register({
    id: 'statistics',
    name: 'Statistics',
    icon: '📈',
    order: 16,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Wallet Statistics</h3>
            <p class="text-gray-600 mb-6">View transaction history and activity stats</p>
            
            <div class="space-y-6">
                <!-- Current Wallet Stats -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <h4 class="text-xl font-bold mb-4">Current Wallet</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-blue-100 text-sm">Address</div>
                            <div class="font-mono text-sm break-all">${TempoApp.account ? TempoApp.account.slice(0, 10) + '...' + TempoApp.account.slice(-8) : '-'}</div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-sm">Network</div>
                            <div class="font-semibold">Tempo Testnet</div>
                        </div>
                    </div>
                </div>

                <!-- Transaction History -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">Transaction History</h4>
                        ${UI.createButton('Refresh', () => this.loadTransactionStats(), 'bg-blue-600 hover:bg-blue-700')}
                    </div>
                    
                    <div id="transactionStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${this.createStatCard('Total TXs', '-', '📊')}
                        ${this.createStatCard('Sent', '-', '📤')}
                        ${this.createStatCard('Received', '-', '📥')}
                        ${this.createStatCard('Failed', '-', '❌')}
                    </div>
                </div>

                <!-- Token Activity -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Token Activity</h4>
                    <div id="tokenActivity" class="space-y-2">
                        <div class="text-sm text-gray-500">Loading token activity...</div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Recent Transactions</h4>
                    <div id="recentTransactions" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-sm text-gray-500">Loading transactions...</div>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="border-t pt-6">
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Export Data</h4>
                    <div class="flex gap-4">
                        ${UI.createButton('Export to CSV', () => this.exportToCsv(), 'bg-green-600 hover:bg-green-700')}
                        ${UI.createButton('Copy Stats', () => this.copyStats(), 'bg-gray-600 hover:bg-gray-700')}
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadTransactionStats();
        await this.loadTokenActivity();
        await this.loadRecentTransactions();
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

    async loadTransactionStats() {
        UI.showStatus('Loading transaction statistics...', 'info');

        try {
            const provider = TempoApp.provider;
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

            // Get transaction count
            const txCount = await provider.getTransactionCount(TempoApp.account);

            // Get sent transactions
            let sentCount = 0;
            let receivedCount = 0;
            let failedCount = 0;

            // Note: In a production app, you'd want to use an indexer or API
            // For demo purposes, we'll use the transaction count and estimate others
            sentCount = txCount;

            const statsContainer = document.getElementById('transactionStats');
            statsContainer.innerHTML = `
                ${this.createStatCard('Total TXs', txCount.toString(), '📊')}
                ${this.createStatCard('Sent', sentCount.toString(), '📤')}
                ${this.createStatCard('Received', receivedCount.toString(), '📥')}
                ${this.createStatCard('Failed', failedCount.toString(), '❌')}
            `;

            UI.showStatus('Statistics loaded', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async loadTokenActivity() {
        const activityDiv = document.getElementById('tokenActivity');
        activityDiv.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

        try {
            const activities = [];

            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                const balance = await contract.balanceOf(TempoApp.account);
                const decimals = await contract.decimals();
                const formatted = ethers.utils.formatUnits(balance, decimals);

                activities.push({
                    symbol,
                    balance: parseFloat(formatted)
                });
            }

            activityDiv.innerHTML = activities
                .filter(a => a.balance > 0)
                .map(a => `
                    <div class="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <div class="font-medium text-gray-800">${a.symbol}</div>
                        <div class="text-gray-600">${a.balance.toFixed(2)}</div>
                    </div>
                `).join('') || '<div class="text-sm text-gray-500">No token holdings found</div>';
        } catch (error) {
            activityDiv.innerHTML = '<div class="text-sm text-red-500">Error loading activity</div>';
        }
    },

    async loadRecentTransactions() {
        const txDiv = document.getElementById('recentTransactions');
        txDiv.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

        try {
            // In production, use an indexer or block explorer API
            // For demo, show placeholder
            const placeholderTxs = [
                { type: 'Send', token: 'PathUSD', amount: '10.00', time: 'Just now', status: 'success' },
                { type: 'Swap', token: 'AlphaUSD → BetaUSD', amount: '5.00', time: '2 min ago', status: 'success' },
                { type: 'Faucet', token: 'PathUSD', amount: '100.00', time: '5 min ago', status: 'success' }
            ];

            txDiv.innerHTML = placeholderTxs.map(tx => `
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium text-gray-800">${tx.type}</div>
                            <div class="text-sm text-gray-600">${tx.token}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-gray-800">${tx.amount}</div>
                            <div class="text-xs text-gray-500">${tx.time}</div>
                        </div>
                    </div>
                </div>
            `).join('') || '<div class="text-sm text-gray-500">No recent transactions</div>';
        } catch (error) {
            txDiv.innerHTML = '<div class="text-sm text-red-500">Error loading transactions</div>';
        }
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
Wallet Statistics
Address: ${TempoApp.account}
Network: Tempo Testnet
Total Transactions: ${txCount}
            `.trim();

            await navigator.clipboard.writeText(stats);
            UI.showStatus('Stats copied to clipboard!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});