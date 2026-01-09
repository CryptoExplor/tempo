// Fixed Faucet Feature (using tempo_fundAddress RPC method)
FeatureRegistry.register({
    id: 'faucet',
    name: 'Faucet',
    icon: '💧',
    order: 6,
    claimHistory: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Claim from Faucet</h3>
            <p class="text-gray-600 mb-6">Get free testnet tokens for the Tempo Moderato testnet</p>
            
            <div class="space-y-6">
                <!-- Faucet Info -->
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-5xl">💧</div>
                        <div>
                            <h4 class="text-xl font-bold text-gray-800">Testnet Faucet</h4>
                            <p class="text-sm text-gray-600">Claim free tokens to test Tempo</p>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg p-4">
                        <div class="text-sm font-medium text-gray-700 mb-2">You'll receive:</div>
                        <div class="space-y-1 text-sm text-gray-600">
                            <div class="flex items-center gap-2">
                                <span class="text-green-600">✓</span>
                                <span>PathUSD (for swaps & liquidity)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-green-600">✓</span>
                                <span>AlphaUSD, BetaUSD, ThetaUSD</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-green-600">✓</span>
                                <span>Native TEMPO (for gas)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Multiple Claims -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label class="block text-sm font-medium text-yellow-900 mb-2">
                        Number of Claims
                    </label>
                    <input type="number" 
                           id="faucetClaimCount" 
                           value="1" 
                           min="1" 
                           max="10"
                           class="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                    <p class="text-xs text-yellow-700 mt-2">
                        ⚠️ Multiple claims help with testing. Each claim has a 2-3 second delay.
                    </p>
                </div>

                <!-- Claim Button -->
                ${UI.createButton('💧 Claim Testnet Tokens', () => this.claimFaucet(), 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90')}

                <!-- Progress Display -->
                <div id="faucetProgress" class="hidden">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="text-sm font-medium text-blue-900 mb-2">Claiming Progress</div>
                        <div id="progressBar" class="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div id="progressFill" class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
                        </div>
                        <div id="progressText" class="text-sm text-blue-700">Preparing...</div>
                    </div>
                </div>

                <!-- Claim History -->
                <div id="claimHistory" class="hidden">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Claims</h4>
                    <div id="claimsList" class="space-y-2 max-h-96 overflow-y-auto"></div>
                </div>

                <!-- Summary Stats -->
                <div id="claimSummary" class="hidden bg-gray-50 rounded-lg p-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Session Summary</div>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-green-600" id="successCount">0</div>
                            <div class="text-xs text-gray-600">Successful</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-red-600" id="failCount">0</div>
                            <div class="text-xs text-gray-600">Failed</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-blue-600" id="totalClaimCount">0</div>
                            <div class="text-xs text-gray-600">Total</div>
                        </div>
                    </div>
                </div>

                <!-- Info Box -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">ℹ️ Faucet Information</div>
                    <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Claims are processed instantly via tempo_fundAddress RPC</li>
                        <li>You can claim multiple times for testing</li>
                        <li>Tokens are sent directly to your connected wallet</li>
                        <li>Use these tokens for swaps, liquidity, and other features</li>
                    </ul>
                </div>
            </div>
        `;
    },

    async claimFaucet() {
        const claimCount = parseInt(document.getElementById('faucetClaimCount').value) || 1;
        
        if (claimCount < 1 || claimCount > 10) {
            UI.showStatus('Please enter a number between 1 and 10', 'error');
            return;
        }

        // Show progress section
        const progressDiv = document.getElementById('faucetProgress');
        const historyDiv = document.getElementById('claimHistory');
        const summaryDiv = document.getElementById('claimSummary');
        
        progressDiv.classList.remove('hidden');
        historyDiv.classList.remove('hidden');
        summaryDiv.classList.remove('hidden');

        let successCount = 0;
        let failCount = 0;

        UI.showStatus(`Starting ${claimCount} faucet claim(s)...`, 'info');

        for (let i = 1; i <= claimCount; i++) {
            const progress = (i / claimCount) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('progressText').textContent = `Claiming ${i}/${claimCount}...`;

            try {
                UI.showStatus(`Claiming faucet ${i}/${claimCount}...`, 'info');

                // Use the custom RPC method tempo_fundAddress
                // This is the key fix - we need to use provider.send() instead of a contract call
                const txHashes = await TempoApp.provider.send('tempo_fundAddress', [TempoApp.account]);

                // Handle response - can be array or single hash
                const hashes = Array.isArray(txHashes) ? txHashes : [txHashes];
                
                successCount++;
                
                // Add to claim history
                this.addToClaimHistory(hashes, i, 'success');
                
                UI.showStatus(`Claim ${i}/${claimCount} successful!`, 'success');

                // Show transaction hashes
                hashes.forEach((hash, idx) => {
                    console.log(`Transaction ${idx + 1}: ${hash}`);
                });

                // Delay between claims (2-3 seconds like the Node.js script)
                if (i < claimCount) {
                    const delay = 2000 + Math.floor(Math.random() * 1000); // 2-3 seconds
                    UI.showStatus(`Waiting ${delay / 1000}s before next claim...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (error) {
                failCount++;
                console.error(`Claim ${i} failed:`, error);
                
                this.addToClaimHistory(null, i, 'failed', error.message);
                
                // Don't stop on error, continue with remaining claims
                UI.showStatus(`Claim ${i} failed: ${error.message}`, 'error');
                
                // Still wait before next claim
                if (i < claimCount) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        // Update summary
        document.getElementById('successCount').textContent = successCount;
        document.getElementById('failCount').textContent = failCount;
        document.getElementById('totalClaimCount').textContent = claimCount;

        // Final status
        if (failCount === 0) {
            UI.showStatus(`All ${claimCount} claim(s) completed successfully! 🎉`, 'success');
        } else {
            UI.showStatus(`Completed: ${successCount} successful, ${failCount} failed`, 'warning');
        }

        // Refresh dashboard balances after a delay
        setTimeout(() => {
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                UI.showStatus('Refreshing balances...', 'info');
                dashboard.loadBalances();
            }
        }, 3000);
    },

    addToClaimHistory(txHashes, claimNumber, status, error = null) {
        const claimsList = document.getElementById('claimsList');
        
        const claimDiv = document.createElement('div');
        claimDiv.className = `${status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 fade-in`;
        
        if (status === 'success') {
            const hashes = Array.isArray(txHashes) ? txHashes : [txHashes];
            
            claimDiv.innerHTML = `
                <div class="mb-2">
                    <div class="text-sm font-medium text-green-800">
                        ✅ Claim #${claimNumber} Successful
                    </div>
                    <div class="text-xs text-green-600">
                        ${hashes.length} transaction(s) created
                    </div>
                </div>
                <div class="space-y-1">
                    ${hashes.map((hash, idx) => `
                        <a href="${CONFIG.EXPLORER_URL}/tx/${hash}" 
                           target="_blank" 
                           class="block text-xs text-blue-600 hover:text-blue-800 font-mono break-all">
                            TX ${idx + 1}: ${hash} →
                        </a>
                    `).join('')}
                </div>
            `;
        } else {
            claimDiv.innerHTML = `
                <div>
                    <div class="text-sm font-medium text-red-800">
                        ❌ Claim #${claimNumber} Failed
                    </div>
                    <div class="text-xs text-red-600 mt-1">
                        ${error ? error.slice(0, 100) : 'Unknown error'}
                    </div>
                </div>
            `;
        }
        
        claimsList.insertBefore(claimDiv, claimsList.firstChild);

        // Keep only last 10 claims visible
        while (claimsList.children.length > 10) {
            claimsList.removeChild(claimsList.lastChild);
        }
    }
});
