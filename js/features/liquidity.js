// Enhanced Liquidity Feature (merged Add & Remove)
FeatureRegistry.register({
    id: 'liquidity',
    name: 'Liquidity',
    icon: '💧',
    order: 13,
    currentMode: 'add',

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Liquidity Management</h3>
            <p class="text-gray-600 mb-6">Add or remove liquidity from pools</p>
            
            <!-- Mode Toggle -->
            <div class="flex gap-2 mb-6">
                <button id="addModeBtn" class="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                    Add Liquidity
                </button>
                <button id="removeModeBtn" class="flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700">
                    Remove Liquidity
                </button>
            </div>

            <!-- Add Liquidity Section -->
            <div id="addLiquiditySection" class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div class="text-sm font-medium text-blue-900 mb-2">➕ Adding Liquidity</div>
                    <p class="text-sm text-blue-700">
                        Provide tokens to earn fees from trades. You'll receive LP tokens representing your share.
                    </p>
                </div>

                ${UI.createSelect('liqUserToken', [
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' },
                    { value: '0x20c0000000000000000000000000000000000002', label: 'BetaUSD' },
                    { value: '0x20c0000000000000000000000000000000000003', label: 'ThetaUSD' }
                ], 'User Token')}
                
                ${UI.createSelect('liqValidatorToken', [
                    { value: '0x20c0000000000000000000000000000000000000', label: 'PathUSD' },
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' }
                ], 'Validator Token')}
                
                ${UI.createAmountInput('liqAmount', 'Amount', '100')}
                
                ${UI.createButton('Add Liquidity', () => this.addLiquidity(), 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90')}
            </div>

            <!-- Remove Liquidity Section -->
            <div id="removeLiquiditySection" class="hidden space-y-4">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div class="text-sm font-medium text-red-900 mb-2">➖ Removing Liquidity</div>
                    <p class="text-sm text-red-700">
                        Burn your LP tokens to withdraw your share of the pool plus earned fees.
                    </p>
                </div>

                ${UI.createSelect('removeUserToken', [
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' },
                    { value: '0x20c0000000000000000000000000000000000002', label: 'BetaUSD' },
                    { value: '0x20c0000000000000000000000000000000000003', label: 'ThetaUSD' }
                ], 'User Token')}
                
                ${UI.createSelect('removeValidatorToken', [
                    { value: '0x20c0000000000000000000000000000000000000', label: 'PathUSD' },
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' }
                ], 'Validator Token')}
                
                <div id="lpBalanceDisplay" class="bg-blue-50 border border-blue-200 rounded-lg p-4 hidden">
                    <div class="text-sm font-medium text-blue-900 mb-1">Your LP Balance</div>
                    <div id="lpBalanceValue" class="text-lg font-bold text-blue-700">-</div>
                </div>

                ${UI.createButton('Check LP Balance', () => this.checkLpBalance(), 'bg-blue-600 hover:bg-blue-700')}
                
                ${UI.createAmountInput('removeLpAmount', 'LP Amount to Remove', '1')}
                
                ${UI.createButton('Remove Liquidity', () => this.removeLiquidity(), 'bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90')}
            </div>

            <!-- Recent Actions -->
            <div id="recentLiquidityActions" class="hidden mt-6">
                <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Actions</h4>
                <div id="liquidityActionsList" class="space-y-2"></div>
            </div>
        `;
    },

    init() {
        const addBtn = document.getElementById('addModeBtn');
        const removeBtn = document.getElementById('removeModeBtn');
        
        if (addBtn) addBtn.onclick = () => this.setMode('add');
        if (removeBtn) removeBtn.onclick = () => this.setMode('remove');
    },

    setMode(mode) {
        this.currentMode = mode;
        
        const addBtn = document.getElementById('addModeBtn');
        const removeBtn = document.getElementById('removeModeBtn');
        const addSection = document.getElementById('addLiquiditySection');
        const removeSection = document.getElementById('removeLiquiditySection');

        if (mode === 'add') {
            addBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md';
            removeBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700';
            addSection.classList.remove('hidden');
            removeSection.classList.add('hidden');
        } else {
            addBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700';
            removeBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md';
            addSection.classList.add('hidden');
            removeSection.classList.remove('hidden');
        }
    },

    async addLiquidity() {
        const userToken = UI.getInputValue('liqUserToken');
        const validatorToken = UI.getInputValue('liqValidatorToken');
        const amount = UI.getInputValue('liqAmount');

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        UI.showStatus('Adding liquidity...', 'info');
        
        try {
            const feeManager = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, 
                FEE_MANAGER_ABI, 
                TempoApp.signer
            );
            
            const valContract = new ethers.Contract(
                validatorToken, 
                ERC20_ABI, 
                TempoApp.signer
            );

            const decimals = await valContract.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            await TempoApp.approveToken(validatorToken, CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, amountWei);

            UI.showStatus('Minting liquidity...', 'info');
            const tx = await feeManager.mintWithValidatorToken(
                userToken, 
                validatorToken, 
                amountWei, 
                TempoApp.account
            );
            
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToRecentActions('add', userToken, validatorToken, amount, tx.hash);
            UI.showStatus('Liquidity added successfully!', 'success');
            
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                setTimeout(() => dashboard.loadBalances(), 2000);
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async checkLpBalance() {
        const userToken = UI.getInputValue('removeUserToken');
        const validatorToken = UI.getInputValue('removeValidatorToken');

        UI.showStatus('Checking LP balance...', 'info');

        try {
            const FEE_MANAGER_ABI = [
                "function getPoolId(address userToken, address validatorToken) view returns (bytes32)",
                "function liquidityBalances(bytes32 poolId, address account) view returns (uint256)"
            ];

            const feeManager = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER,
                FEE_MANAGER_ABI,
                TempoApp.provider
            );

            const poolId = await feeManager.getPoolId(userToken, validatorToken);
            const lpBalance = await feeManager.liquidityBalances(poolId, TempoApp.account);

            const formatted = ethers.utils.formatUnits(lpBalance, 6);

            const balanceDisplay = document.getElementById('lpBalanceDisplay');
            const balanceValue = document.getElementById('lpBalanceValue');
            
            balanceDisplay.classList.remove('hidden');
            balanceValue.textContent = `${parseFloat(formatted).toFixed(6)} LP`;

            UI.showStatus('Balance loaded successfully', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async removeLiquidity() {
        const userToken = UI.getInputValue('removeUserToken');
        const validatorToken = UI.getInputValue('removeValidatorToken');
        const amount = UI.getInputValue('removeLpAmount');

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        UI.showStatus('Removing liquidity...', 'info');

        try {
            const FEE_MANAGER_ABI = [
                "function getPoolId(address userToken, address validatorToken) view returns (bytes32)",
                "function liquidityBalances(bytes32 poolId, address account) view returns (uint256)",
                "function burn(address userToken, address validatorToken, uint256 amount, address to) returns (uint256, uint256)"
            ];

            const feeManager = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER,
                FEE_MANAGER_ABI,
                TempoApp.signer
            );

            const poolId = await feeManager.getPoolId(userToken, validatorToken);
            const lpBalance = await feeManager.liquidityBalances(poolId, TempoApp.account);

            const amountWei = ethers.utils.parseUnits(amount, 6);

            if (lpBalance.lt(amountWei)) {
                UI.showStatus('Insufficient LP balance', 'error');
                return;
            }

            UI.showStatus('Burning LP tokens...', 'info');
            const tx = await feeManager.burn(
                userToken,
                validatorToken,
                amountWei,
                TempoApp.account
            );

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();
            
            this.addToRecentActions('remove', userToken, validatorToken, amount, tx.hash);
            UI.showStatus('Liquidity removed successfully!', 'success');

            // Refresh balances
            await this.checkLpBalance();
            
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                setTimeout(() => dashboard.loadBalances(), 2000);
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    addToRecentActions(action, userToken, validatorToken, amount, txHash) {
        const recentActions = document.getElementById('recentLiquidityActions');
        const actionsList = document.getElementById('liquidityActionsList');
        
        recentActions.classList.remove('hidden');

        const isAdd = action === 'add';
        const actionDiv = document.createElement('div');
        actionDiv.className = `${isAdd ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 fade-in`;
        actionDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium ${isAdd ? 'text-green-800' : 'text-red-800'}">
                        ${isAdd ? '➕' : '➖'} ${amount} ${isAdd ? 'tokens' : 'LP'} ${isAdd ? 'added' : 'removed'}
                    </div>
                    <div class="text-xs ${isAdd ? 'text-green-600' : 'text-red-600'}">
                        Pool: ${userToken.slice(0, 6)}.../${validatorToken.slice(0, 6)}...
                    </div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;
        
        actionsList.insertBefore(actionDiv, actionsList.firstChild);

        // Keep only last 5 actions
        while (actionsList.children.length > 5) {
            actionsList.removeChild(actionsList.lastChild);
        }
    }
});