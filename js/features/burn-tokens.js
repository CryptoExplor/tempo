// Burn Tokens Feature
FeatureRegistry.register({
    id: 'burn-tokens',
    name: 'Burn Tokens',
    icon: '🔥',
    order: 9,
    userTokens: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Burn Tokens</h3>
            <p class="text-gray-600 mb-6">Permanently destroy tokens from your balance</p>
            
            <div class="space-y-6">
                <!-- Load Tokens -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Your Created Tokens</h4>
                    <div id="burnUserTokensList" class="mb-4 space-y-2">
                        <div class="text-sm text-gray-500">Click "Load My Tokens" to scan for tokens you've created</div>
                    </div>
                    ${UI.createButton('Load My Tokens', () => this.loadUserTokens(), 'bg-blue-600 hover:bg-blue-700')}
                </div>

                <!-- Burn Interface -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Burn Tokens</h4>
                    <div class="space-y-4">
                        <div id="burnTokenSelectContainer">
                            <p class="text-sm text-gray-500">Load your tokens first</p>
                        </div>

                        <div id="currentBalance" class="bg-blue-50 border border-blue-200 rounded-lg p-4 hidden">
                            <div class="text-sm text-blue-700 font-medium mb-1">Your Balance</div>
                            <div id="balanceDisplay" class="text-lg font-bold text-blue-900">-</div>
                        </div>

                        ${UI.createAmountInput('burnAmount', 'Amount to Burn', '10')}

                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-red-900 mb-2">⚠️ Warning</div>
                            <ul class="text-sm text-red-700 space-y-1 list-disc list-inside">
                                <li>Burned tokens are permanently destroyed</li>
                                <li>This action cannot be undone</li>
                                <li>Make sure you have sufficient balance</li>
                            </ul>
                        </div>

                        ${UI.createButton('Check Balance', () => this.checkBalance(), 'bg-blue-600 hover:bg-blue-700')}
                        ${UI.createButton('🔥 Burn Tokens', () => this.burnTokens(), 'bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-90')}
                    </div>
                </div>

                <!-- Recent Burns -->
                <div id="recentBurns" class="hidden">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Burns</h4>
                    <div id="burnsList" class="space-y-2"></div>
                </div>
            </div>
        `;
    },

    async loadUserTokens() {
        UI.showStatus('Scanning for your created tokens...', 'info');
        
        try {
            const factory = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.TIP20_FACTORY,
                TIP20_FACTORY_ABI,
                TempoApp.provider
            );

            const filter = factory.filters.TokenCreated(null, null, null, null, null, TempoApp.account);
            const events = await factory.queryFilter(filter);

            this.userTokens = [];
            const tokensList = document.getElementById('burnUserTokensList');
            tokensList.innerHTML = '';

            if (events.length === 0) {
                tokensList.innerHTML = '<div class="text-sm text-yellow-600">No tokens found. Create a token first.</div>';
                UI.showStatus('No tokens found for your address', 'warning');
                return;
            }

            for (const event of events) {
                const tokenAddress = event.args.token;
                
                try {
                    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, TempoApp.provider);
                    const symbol = await tokenContract.symbol();
                    const balance = await tokenContract.balanceOf(TempoApp.account);
                    const decimals = await tokenContract.decimals();
                    const formatted = ethers.utils.formatUnits(balance, decimals);
                    
                    this.userTokens.push({
                        address: tokenAddress,
                        symbol: symbol,
                        balance: formatted,
                        decimals: decimals
                    });

                    const tokenDiv = document.createElement('div');
                    tokenDiv.className = 'bg-gray-50 p-3 rounded-lg fade-in';
                    tokenDiv.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-medium text-gray-800">${symbol}</div>
                                <div class="text-xs text-gray-500 break-all">${tokenAddress}</div>
                            </div>
                            <div class="text-sm font-semibold text-gray-700">${parseFloat(formatted).toFixed(2)}</div>
                        </div>
                    `;
                    tokensList.appendChild(tokenDiv);
                } catch (err) {
                    console.error('Error loading token:', err);
                }
            }

            const tokenSelectContainer = document.getElementById('burnTokenSelectContainer');
            const options = this.userTokens.map(token => ({
                value: token.address,
                label: `${token.symbol} (Balance: ${parseFloat(token.balance).toFixed(2)})`
            }));
            
            tokenSelectContainer.innerHTML = UI.createSelect('burnTokenAddress', options, 'Select Token');

            // Add event listener for balance check on selection change
            const select = document.getElementById('burnTokenAddress');
            if (select) {
                select.addEventListener('change', () => this.checkBalance());
            }

            UI.showStatus(`Found ${this.userTokens.length} token(s)`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async checkBalance() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('burnTokenAddress');
        const token = this.userTokens.find(t => t.address === tokenAddress);

        if (token) {
            const balanceDiv = document.getElementById('currentBalance');
            const balanceDisplay = document.getElementById('balanceDisplay');
            
            balanceDiv.classList.remove('hidden');
            balanceDisplay.textContent = `${parseFloat(token.balance).toFixed(6)} ${token.symbol}`;
        }
    },

    async burnTokens() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('burnTokenAddress');
        const amount = UI.getInputValue('burnAmount');

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        const token = this.userTokens.find(t => t.address === tokenAddress);
        if (!token) {
            UI.showStatus('Token not found', 'error');
            return;
        }

        if (parseFloat(amount) > parseFloat(token.balance)) {
            UI.showStatus('Insufficient balance', 'error');
            return;
        }

        UI.showStatus('Burning tokens...', 'info');

        try {
            const TIP20_EXTENDED_ABI = [
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)",
                "function balanceOf(address owner) view returns (uint256)",
                "function burn(uint256 amount)"
            ];

            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_EXTENDED_ABI,
                TempoApp.signer
            );

            const amountWei = ethers.utils.parseUnits(amount, token.decimals);

            UI.showStatus('Burning tokens...', 'info');
            const tx = await tokenContract.burn(amountWei, { gasLimit: 500000 });
            
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToRecentBurns(tx.hash, token.symbol, amount);
            UI.showStatus(`Successfully burned ${amount} ${token.symbol}!`, 'success');

            // Reload tokens to update balances
            setTimeout(() => this.loadUserTokens(), 2000);
        } catch (error) {
            if (error.message.includes('ERC20: burn amount exceeds balance')) {
                UI.showStatus('Insufficient balance to burn', 'error');
            } else {
                UI.showStatus(`Error: ${error.message}`, 'error');
            }
        }
    },

    addToRecentBurns(txHash, symbol, amount) {
        const recentBurns = document.getElementById('recentBurns');
        const burnsList = document.getElementById('burnsList');
        
        recentBurns.classList.remove('hidden');

        const burnDiv = document.createElement('div');
        burnDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-3 fade-in';
        burnDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-red-800">🔥 Burned ${amount} ${symbol}</div>
                    <div class="text-xs text-red-600">Tokens permanently destroyed</div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;
        
        burnsList.insertBefore(burnDiv, burnsList.firstChild);
    }
});