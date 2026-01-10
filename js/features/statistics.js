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
            
            console.log('Loading stats for address:', TempoApp.account);
            
            // Get transaction count
            const txCount = await provider.getTransactionCount(TempoApp.account);
            console.log('Transaction count:', txCount);
            
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

        activityDiv.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">Scanning recent blocks...</div>';

        try {
            const currentBlock = await TempoApp.provider.getBlockNumber();
            // Scan only recent blocks - testnets don't keep full history
            const fromBlock = Math.max(currentBlock - 50000, 0);
            
            console.log(`Scanning from block ${fromBlock} to ${currentBlock} (${currentBlock - fromBlock} blocks)`);
            
            const activities = [];

            // Method 1: Get native transaction history (catches all txs including mints)
            try {
                console.log('Fetching transaction history from provider...');
                const history = await TempoApp.provider.getHistory(
                    TempoApp.account,
                    fromBlock,
                    currentBlock
                );
                
                console.log(`Found ${history.length} transactions in history`);
                
                for (const tx of history) {
                    // Skip if no value transferred
                    if (tx.value && tx.value.gt(0)) {
                        activities.push({
                            type: tx.from.toLowerCase() === TempoApp.account.toLowerCase() ? 'Sent' : 'Received',
                            token: 'Native TX',
                            amount: parseFloat(ethers.utils.formatEther(tx.value)),
                            blockNumber: tx.blockNumber,
                            txHash: tx.hash,
                            icon: tx.from.toLowerCase() === TempoApp.account.toLowerCase() ? '⚡' : '⬇️',
                            color: tx.from.toLowerCase() === TempoApp.account.toLowerCase() ? 'blue' : 'purple',
                            to: tx.to,
                            from: tx.from,
                            timestamp: null
                        });
                    }
                }
            } catch (historyErr) {
                console.error('Error fetching transaction history:', historyErr);
                // Continue with event logs anyway
            }

            // Method 2: Scan token Transfer events
            for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
                console.log(`Scanning ${symbol} events...`);
                
                try {
                    const contract = new ethers.Contract(address, ERC20_ABI, TempoApp.provider);
                    const decimals = await contract.decimals();
                    
                    // Get sent transfers
                    try {
                        const sentFilter = contract.filters.Transfer(TempoApp.account, null);
                        const sentEvents = await contract.queryFilter(sentFilter, fromBlock, currentBlock);
                        console.log(`Found ${sentEvents.length} sent events for ${symbol}`);
                        
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
                    } catch (sentErr) {
                        console.warn(`Could not fetch sent events for ${symbol}:`, sentErr.message);
                    }
                    
                    // Get received transfers
                    try {
                        const receivedFilter = contract.filters.Transfer(null, TempoApp.account);
                        const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, currentBlock);
                        console.log(`Found ${receivedEvents.length} received events for ${symbol}`);
                        
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
                    } catch (recErr) {
                        console.warn(`Could not fetch received events for ${symbol}:`, recErr.message);
                    }
                } catch (err) {
                    console.warn(`Error scanning ${symbol}:`, err.message);
                }
            }
            
            console.log(`Total activities found: ${activities.length}`);

            if (activities.length === 0) {
                console.log('No activities found - showing explorer hint');
                activityDiv.innerHTML = `
                    <div class="text-center py-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200">
                        <div class="text-5xl mb-3">📊</div>
                        <div class="text-gray-700 font-medium mb-2">No Recent Activity Found</div>
                        <div class="text-sm text-gray-600 mb-1">Scanned last ${(currentBlock - fromBlock).toLocaleString()} blocks</div>
                        <div class="text-xs text-gray-500 mb-4">Block range: ${fromBlock.toLocaleString()} - ${currentBlock.toLocaleString()}</div>
                        
                        <!-- Testnet Limitation Notice -->
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-auto max-w-md mb-4">
                            <div class="text-sm text-yellow-800 mb-2">
                                <strong>⚠️ Testnet RPC Limitations</strong>
                            </div>
                            <div class="text-xs text-yellow-700 text-left space-y-1">
                                <div>• RPC nodes may not expose full historical logs</div>
                                <div>• Faucet mints may not emit standard Transfer events</div>
                                <div>• Transaction count (${document.getElementById('totalTxCount')?.textContent || '?'}) only counts sent transactions</div>
                                <div>• Explorer indexing is more complete than RPC</div>
                            </div>
                        </div>
                        
                        <div class="text-sm text-gray-500 mb-4">Your balances show correctly because state ≠ logs</div>
                        
                        <div class="flex justify-center gap-2 flex-wrap">
                            <button onclick="window.open('${CONFIG.EXPLORER_URL}/address/${TempoApp.account}', '_blank')" 
                                    class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                                📊 View Full History on Explorer
                            </button>
                            <button onclick="FeatureRegistry.showFeature('faucet')" 
                                    class="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
                                💧 Get Faucet
                            </button>
                            <button onclick="FeatureRegistry.showFeature('swap')" 
                                    class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold">
                                🔄 Make a Swap
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            // Sort by block number (most recent first)
            activities.sort((a, b) => b.blockNumber - a.blockNumber);

            // Remove duplicates (same tx hash)
            const uniqueActivities = [];
            const seenTxs = new Set();
            for (const activity of activities) {
                if (!seenTxs.has(activity.txHash)) {
                    seenTxs.add(activity.txHash);
                    uniqueActivities.push(activity);
                }
            }

            // Get timestamps for recent activities
            const recentActivities = uniqueActivities.slice(0, 15);
            for (const activity of recentActivities) {
                try {
                    const block = await TempoApp.provider.getBlock(activity.blockNumber);
                    activity.timestamp = block.timestamp;
                } catch (err) {
                    console.error('Error getting block timestamp:', err);
                }
            }

            activityDiv.innerHTML = `
                <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-blue-800">
                            <strong>📊 Showing ${recentActivities.length} recent transactions</strong>
                        </div>
                        <div class="text-xs text-blue-600">
                            Scanned: ${(currentBlock - fromBlock).toLocaleString()} blocks
                        </div>
                    </div>
                    ${uniqueActivities.length > recentActivities.length ? `
                        <div class="text-xs text-blue-600 mt-1">
                            Found ${uniqueActivities.length} total • 
                            <a href="${CONFIG.EXPLORER_URL}/address/${TempoApp.account}" 
                               target="_blank" 
                               class="underline hover:text-blue-800">
                                View all on Explorer
                            </a>
                        </div>
                    ` : ''}
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
                    <div class="text-xs text-yellow-700 mb-4">
                        This is common on testnets with limited RPC infrastructure.
                    </div>
                    <div class="flex justify-center gap-2">
                        <button onclick="window.open('${CONFIG.EXPLORER_URL}/address/${TempoApp.account}', '_blank')" 
                                class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                            📊 View on Explorer Instead
                        </button>
                        <button onclick="FeatureRegistry.features.find(f => f.id === 'statistics').loadRecentActivity()" 
                                class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold">
                            🔄 Retry
                        </button>
                    </div>
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
