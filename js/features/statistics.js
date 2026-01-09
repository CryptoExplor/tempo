// Enhanced Statistics Feature - FIXED to show real data
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
                            <div class="text-blue-100 text-xs mb-1">Native Balance</div>
                            <div id="nativeBalance" class="text-lg font-semibold">-</div>
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
                    ${UI.createButton('📊 View on Explorer', () => this.openExplorer(), 'bg-purple-600 hover:bg-purple-700')}
                </div>

                <!-- Token Holdings -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Token Holdings</h4>
                    <div id="tokenHoldings" class="space-y-2">
                        <div class="text-sm text-gray-500">Loading token holdings...</div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div>
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h4>
                    <div id="recentActivity" class="space-y-2">
                        <div class="text-sm text-gray-500">Loading recent activity...</div>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="border-t pt-6">
                    <h4 class="text-lg font-semibold mb-4 text-gray-800">Export & Share</h4>
                    <div class="flex flex-wrap gap-4">
                        ${UI.createButton('📄 Export CSV', () => this.exportToCsv(), 'bg-green-600 hover:bg-green-700')}
                        ${UI.createButton('📋 Copy Address', () => this.copyAddress(), 'bg-gray-600 hover:bg-gray-700')}
                        ${UI.createButton('🔗 View Explorer', () => this.openExplorer(), 'bg-blue-600 hover:bg-blue-700')}
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadAllStats();
    },

    async loadAllStats() {
        UI.showStatus('Loading statistics...', 'info');

        try {
            const provider = TempoApp.provider;
            
            // Get transaction count
            const txCount = await provider.getTransactionCount(TempoApp.account);
            document.getElementById('totalTxCount').textContent = txCount.toString();

            // Get native balance
            const balance = await provider.getBalance(TempoApp.account);
            const formatted = ethers.utils.formatEther(balance);
            document.getElementById('nativeBalance').textContent = parseFloat(formatted).toFixed(4) + ' TEMPO';

            // Load token holdings
            await this.loadTokenHoldings();

            // Load recent activity
            await this.loadRecentActivity();

            UI.showStatus('Statistics loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading stats:', error);
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async loadTokenHoldings() {
        const holdingsDiv = document.getElementById('tokenHoldings');
        holdingsDiv.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

        try {
            const holdings = [];

            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                try {
                    const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                    const balance = await contract.balanceOf(TempoApp.account);
                    const decimals = await contract.decimals();
                    const formatted = ethers.utils.formatUnits(balance, decimals);

                    holdings.push({
                        symbol,
                        balance: parseFloat(formatted),
                        address
                    });
                } catch (err) {
                    console.error(`Error loading ${symbol}:`, err);
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
            console.error('Error loading holdings:', error);
            holdingsDiv.innerHTML = '<div class="text-sm text-red-500">Error loading holdings</div>';
        }
    },

    async loadRecentActivity() {
        const activityDiv = document.getElementById('recentActivity');
        activityDiv.innerHTML = '<div class="text-sm text-gray-500">Scanning blockchain...</div>';

        try {
            const currentBlock = await TempoApp.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000);
            
            // Get transfer events for all tokens
            const activities = [];

            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                try {
                    const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                    
                    // Get transfers from this account
                    const sentFilter = contract.filters.Transfer(TempoApp.account, null);
                    const sentEvents = await contract.queryFilter(sentFilter, fromBlock, currentBlock);
                    
                    // Get transfers to this account
                    const receivedFilter = contract.filters.Transfer(null, TempoApp.account);
                    const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, currentBlock);

                    const decimals = await contract.decimals();

                    for (const event of sentEvents) {
                        const amount = ethers.utils.formatUnits(event.args.value, decimals);
                        activities.push({
                            type: 'Sent',
                            token: symbol,
                            amount: parseFloat(amount).toFixed(2),
                            blockNumber: event.blockNumber,
                            txHash: event.transactionHash,
                            icon: '📤',
                            color: 'red',
                            to: event.args.to
                        });
                    }

                    for (const event of receivedEvents) {
                        const amount = ethers.utils.formatUnits(event.args.value, decimals);
                        activities.push({
                            type: 'Received',
                            token: symbol,
                            amount: parseFloat(amount).toFixed(2),
                            blockNumber: event.blockNumber,
                            txHash: event.transactionHash,
                            icon: '📥',
                            color: 'green',
                            from: event.args.from
                        });
                    }
                } catch (err) {
                    console.error(`Error scanning ${symbol}:`, err);
                }
            }

            if (activities.length === 0) {
                activityDiv.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">📊</div>
                        <div>No recent activity found</div>
                        <div class="text-sm mt-2">Use the faucet or swap features to get started</div>
                    </div>
                `;
                return;
            }

            // Sort by block number (most recent first)
            activities.sort((a, b) => b.blockNumber - a.blockNumber);

            // Show only last 10
            const recentActivities = activities.slice(0, 10);

            activityDiv.innerHTML = recentActivities.map(act => `
                <div class="bg-${act.color}-50 border border-${act.color}-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">${act.icon}</div>
                            <div>
                                <div class="font-medium text-gray-800">${act.type} ${act.token}</div>
                                <div class="text-xs text-gray-600">
                                    ${act.type === 'Sent' ? 'To: ' + act.to.slice(0, 10) + '...' : 'From: ' + act.from.slice(0, 10) + '...'}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-gray-800">${act.amount}</div>
                            <a href="${CONFIG.EXPLORER_URL}/tx/${act.txHash}" 
                               target="_blank" 
                               class="text-xs text-blue-600 hover:text-blue-800">
                                View TX →
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading activity:', error);
            activityDiv.innerHTML = '<div class="text-sm text-yellow-600">Unable to load recent activity. Try refreshing.</div>';
        }
    },

    async exportToCsv() {
        UI.showStatus('Exporting data...', 'info');

        try {
            const data = [];
            
            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                try {
                    const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                    const balance = await contract.balanceOf(TempoApp.account);
                    const decimals = await contract.decimals();
                    const formatted = ethers.utils.formatUnits(balance, decimals);

                    data.push({
                        Token: symbol,
                        Address: address,
                        Balance: formatted
                    });
                } catch (err) {
                    console.error(`Error exporting ${symbol}:`, err);
                }
            }

            const csv = [
                ['Token', 'Address', 'Balance'],
                ...data.map(d => [d.Token, d.Address, d.Balance])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tempo-stats-${TempoApp.account.slice(0, 8)}-${Date.now()}.csv`;
            a.click();

            UI.showStatus('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async copyAddress() {
        try {
            await navigator.clipboard.writeText(TempoApp.account);
            UI.showStatus('Address copied to clipboard!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    openExplorer() {
        const explorerUrl = `${CONFIG.EXPLORER_URL}/address/${TempoApp.account}`;
        window.open(explorerUrl, '_blank');
    }
});
