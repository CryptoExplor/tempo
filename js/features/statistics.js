// Enhanced Statistics Feature - FIXED with no native balance
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
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Address</div>
                            <div class="font-mono text-sm break-all">
                                ${TempoApp.account ? TempoApp.account.slice(0, 6) + '...' + TempoApp.account.slice(-4) : '-'}
                            </div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Total Transactions</div>
                            <div id="totalTxCount" class="text-2xl font-bold">-</div>
                        </div>
                        <div>
                            <div class="text-blue-100 text-xs mb-1">Network</div>
                            <div class="font-semibold">Moderato Testnet</div>
                            <div class="text-xs text-blue-100">Chain ID: ${CONFIG.CHAIN_ID}</div>
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
            const txCountElement = document.getElementById('totalTxCount');
            if (txCountElement) {
                txCountElement.textContent = txCount.toString();
            }

            // Load token holdings
            await this.loadTokenHoldings();

            // Load recent activity
            await this.loadRecentActivity();

            UI.showStatus('Statistics loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading stats:', error);
            UI.showStatus(`Error loading statistics: ${error.message}`, 'error');
        }
    },

    async loadTokenHoldings() {
        const holdingsDiv = document.getElementById('tokenHoldings');
        if (!holdingsDiv) {
            console.warn('Token holdings div not found');
            return;
        }

        holdingsDiv.innerHTML = '<div class="text-sm text-gray-500">Loading token holdings...</div>';

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
                holdingsDiv.innerHTML = `
                    <div class="text-center py-6 text-gray-500">
                        <div class="text-3xl mb-2">💰</div>
                        <div>No token holdings found</div>
                        <div class="text-sm mt-1">Use the faucet to get started</div>
                    </div>
                `;
                return;
            }

            // Sort by balance (highest first)
            holdings.sort((a, b) => b.balance - a.balance);

            holdingsDiv.innerHTML = holdings.map(h => `
                <div class="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors border border-gray-200">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800 text-lg">${h.symbol}</div>
                        <div class="text-xs text-gray-500 font-mono break-all">${h.address.slice(0, 10)}...${h.address.slice(-8)}</div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="font-bold text-gray-800 text-xl">${h.balance.toFixed(2)}</div>
                        <div class="text-xs text-gray-600">${h.symbol}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading holdings:', error);
            holdingsDiv.innerHTML = `
                <div class="text-center py-6 text-red-500">
                    <div class="text-3xl mb-2">⚠️</div>
                    <div class="text-sm">Error loading token holdings</div>
                    <div class="text-xs mt-1">${error.message}</div>
                </div>
            `;
        }
    },

    async loadRecentActivity() {
        const activityDiv = document.getElementById('recentActivity');
        if (!activityDiv) {
            console.warn('Recent activity div not found');
            return;
        }

        activityDiv.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">Scanning blockchain for your transactions...</div>';

        try {
            const currentBlock = await TempoApp.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 2000); // Scan more blocks
            
            const activities = [];

            // Scan all token transfers
            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                try {
                    const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                    
                    // Get sent transfers
                    const sentFilter = contract.filters.Transfer(TempoApp.account, null);
                    const sentEvents = await contract.queryFilter(sentFilter, fromBlock, currentBlock);
                    
                    // Get received transfers
                    const receivedFilter = contract.filters.Transfer(null, TempoApp.account);
                    const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, currentBlock);

                    const decimals = await contract.decimals();

                    // Process sent transfers
                    for (const event of sentEvents) {
                        const amount = ethers.utils.formatUnits(event.args.value, decimals);
                        activities.push({
                            type: 'Sent',
                            token: symbol,
                            amount: parseFloat(amount),
                            blockNumber: event.blockNumber,
                            txHash: event.transactionHash,
                            icon: '📤',
                            color: 'red',
                            to: event.args.to,
                            timestamp: null
                        });
                    }

                    // Process received transfers
                    for (const event of receivedEvents) {
                        const amount = ethers.utils.formatUnits(event.args.value, decimals);
                        activities.push({
                            type: 'Received',
                            token: symbol,
                            amount: parseFloat(amount),
                            blockNumber: event.blockNumber,
                            txHash: event.transactionHash,
                            icon: '📥',
                            color: 'green',
                            from: event.args.from,
                            timestamp: null
                        });
                    }
                } catch (err) {
                    console.error(`Error scanning ${symbol}:`, err);
                }
            }

            if (activities.length === 0) {
                activityDiv.innerHTML = `
                    <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="text-5xl mb-3">📊</div>
                        <div class="text-gray-700 font-medium mb-2">No Recent Activity</div>
                        <div class="text-sm text-gray-500">Start using the testnet to see your transactions here</div>
                        <div class="mt-4 flex justify-center gap-2">
                            <button onclick="FeatureRegistry.showFeature('faucet')" 
                                    class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                                Get Faucet
                            </button>
                            <button onclick="FeatureRegistry.showFeature('swap')" 
                                    class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold">
                                Make a Swap
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            // Sort by block number (most recent first)
            activities.sort((a, b) => b.blockNumber - a.blockNumber);

            // Get timestamps for recent activities
            const recentActivities = activities.slice(0, 15);
            for (const activity of recentActivities) {
                try {
                    const block = await TempoApp.provider.getBlock(activity.blockNumber);
                    activity.timestamp = block.timestamp;
                } catch (err) {
                    console.error('Error getting block timestamp:', err);
                }
            }

            activityDiv.innerHTML = `
                <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm text-gray-600">Showing ${recentActivities.length} most recent transactions</div>
                    <div class="text-xs text-gray-500">Total: ${activities.length} transactions found</div>
                </div>
                ${recentActivities.map(act => {
                    const timeAgo = act.timestamp 
                        ? this.getTimeAgo(act.timestamp)
                        : 'Block #' + act.blockNumber;
                    
                    return `
                        <div class="bg-${act.color}-50 border border-${act.color}-200 rounded-lg p-4 hover:shadow-md transition-all mb-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3 flex-1">
                                    <div class="text-3xl">${act.icon}</div>
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-800 mb-1">
                                            ${act.type} ${act.amount.toFixed(4)} ${act.token}
                                        </div>
                                        <div class="text-xs text-gray-600 font-mono">
                                            ${act.type === 'Sent' 
                                                ? 'To: ' + act.to.slice(0, 12) + '...' + act.to.slice(-10)
                                                : 'From: ' + act.from.slice(0, 12) + '...' + act.from.slice(-10)
                                            }
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">${timeAgo}</div>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <a href="${CONFIG.EXPLORER_URL}/tx/${act.txHash}" 
                                       target="_blank" 
                                       class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-semibold transition-colors">
                                        View TX →
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;

        } catch (error) {
            console.error('Error loading activity:', error);
            activityDiv.innerHTML = `
                <div class="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div class="text-4xl mb-2">⚠️</div>
                    <div class="text-yellow-800 font-medium mb-2">Unable to load recent activity</div>
                    <div class="text-sm text-yellow-600 mb-4">${error.message}</div>
                    <button onclick="FeatureRegistry.features.find(f => f.id === 'statistics').loadRecentActivity()" 
                            class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold">
                        Try Again
                    </button>
                </div>
            `;
        }
    },

    getTimeAgo(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        return Math.floor(diff / 86400) + ' days ago';
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
