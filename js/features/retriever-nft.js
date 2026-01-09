// Enhanced Retriever NFT Feature (replaces basic NFT)
FeatureRegistry.register({
    id: 'retriever-nft',
    name: 'Retriever NFT',
    icon: '🐕',
    order: 18,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Retriever NFT Collection</h3>
            <p class="text-gray-600 mb-6">Claim your Retriever NFT on Tempo Testnet</p>
            
            <div class="space-y-6">
                <!-- NFT Info -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-6xl">🐕</div>
                        <div>
                            <h4 class="text-xl font-bold text-gray-800">Retriever NFT</h4>
                            <p class="text-sm text-gray-600">Collectible NFT series</p>
                        </div>
                    </div>
                    
                    <div id="nftBalance" class="bg-white rounded-lg p-4 mb-4">
                        <div class="text-sm text-gray-600">Your Balance</div>
                        <div class="text-2xl font-bold text-purple-600">-</div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-gray-600">Contract</div>
                            <div class="font-mono text-xs break-all">${CONFIG.RETRIEVER_NFT_CONTRACT}</div>
                        </div>
                        <div>
                            <div class="text-gray-600">Cost</div>
                            <div class="font-semibold text-green-600">FREE</div>
                        </div>
                    </div>
                </div>

                <!-- Claim Section -->
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="text-sm font-medium text-blue-900 mb-2">📋 Claim Instructions</div>
                        <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Free claim for testnet users</li>
                            <li>One NFT per transaction</li>
                            <li>Check your balance before claiming</li>
                        </ul>
                    </div>

                    ${UI.createButton('Check My Balance', () => this.checkBalance(), 'bg-blue-600 hover:bg-blue-700')}
                    ${UI.createButton('🐕 Claim Retriever NFT', () => this.claimRetriever(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
                </div>

                <!-- Recent Claims -->
                <div id="recentClaims" class="hidden">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Claims</h4>
                    <div id="claimsList" class="space-y-2"></div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.checkBalance();
    },

    async checkBalance() {
        UI.showStatus('Checking NFT balance...', 'info');

        try {
            const nft = new ethers.Contract(
                CONFIG.RETRIEVER_NFT_CONTRACT,
                RETRIEVER_NFT_ABI,
                TempoApp.provider
            );

            const balance = await nft.balanceOf(TempoApp.account);
            
            const balanceDiv = document.getElementById('nftBalance');
            balanceDiv.innerHTML = `
                <div class="text-sm text-gray-600">Your Balance</div>
                <div class="text-2xl font-bold text-purple-600">${balance.toString()} NFT${balance.gt(1) ? 's' : ''}</div>
            `;

            UI.showStatus('Balance loaded', 'success');
            return balance;
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
            return ethers.BigNumber.from(0);
        }
    },

    async claimRetriever() {
        UI.showStatus('Claiming Retriever NFT...', 'info');

        try {
            const nft = new ethers.Contract(
                CONFIG.RETRIEVER_NFT_CONTRACT,
                RETRIEVER_NFT_ABI,
                TempoApp.signer
            );

            const balanceBefore = await nft.balanceOf(TempoApp.account);

            const allowlistProof = {
                proof: [],
                quantityLimitPerWallet: ethers.constants.MaxUint256,
                pricePerToken: 0,
                currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            };

            UI.showStatus('Minting NFT...', 'info');
            const tx = await nft.claim(
                TempoApp.account,
                1,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                0,
                allowlistProof,
                "0x"
            );

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            const balanceAfter = await nft.balanceOf(TempoApp.account);

            // Update balance display
            const balanceDiv = document.getElementById('nftBalance');
            balanceDiv.innerHTML = `
                <div class="text-sm text-gray-600">Your Balance</div>
                <div class="text-2xl font-bold text-purple-600">${balanceAfter.toString()} NFT${balanceAfter.gt(1) ? 's' : ''}</div>
                <div class="text-sm text-green-600 mt-1">+1 NFT Minted! 🎉</div>
            `;

            // Add to recent claims
            this.addToRecentClaims(tx.hash, balanceAfter.toString());

            UI.showStatus('NFT claimed successfully! 🎉', 'success');
        } catch (error) {
            // Check if already claimed
            if (error.message.includes('already claimed') || error.message.includes('not eligible')) {
                UI.showStatus('You may have already claimed or are not eligible', 'warning');
            } else {
                UI.showStatus(`Error: ${error.message}`, 'error');
            }
        }
    },

    addToRecentClaims(txHash, newBalance) {
        const recentClaims = document.getElementById('recentClaims');
        const claimsList = document.getElementById('claimsList');
        
        recentClaims.classList.remove('hidden');

        const claimDiv = document.createElement('div');
        claimDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-3 fade-in';
        claimDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-green-800">NFT Claimed!</div>
                    <div class="text-xs text-green-600">New Balance: ${newBalance}</div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;
        
        claimsList.insertBefore(claimDiv, claimsList.firstChild);
    }
});