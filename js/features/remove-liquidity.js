// Remove Liquidity Feature
FeatureRegistry.register({
    id: 'remove-liquidity',
    name: 'Remove Liquidity',
    icon: '💸',
    order: 13,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Remove Liquidity</h3>
            <p class="text-gray-600 mb-6">Withdraw your liquidity from pools</p>
            
            <div class="space-y-4">
                ${UI.createSelect('removeUserToken', [
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' },
                    { value: '0x20c0000000000000000000000000000000000002', label: 'BetaUSD' },
                    { value: '0x20c0000000000000000000000000000000000003', label: 'ThetaUSD' }
                ], 'User Token')}
                
                ${UI.createSelect('removeValidatorToken', [
                    { value: '0x20c0000000000000000000000000000000000000', label: 'PathUSD' },
                    { value: '0x20c0000000000000000000000000000000000001', label: 'AlphaUSD' }
                ], 'Validator Token')}
                
                ${UI.createAmountInput('removeLpAmount', 'LP Amount to Remove', '1')}
                
                <div id="lpBalanceDisplay" class="bg-blue-50 border border-blue-200 rounded-lg p-4 hidden">
                    <div class="text-sm font-medium text-blue-900 mb-1">Your LP Balance</div>
                    <div id="lpBalanceValue" class="text-lg font-bold text-blue-700">-</div>
                </div>

                ${UI.createButton('Check LP Balance', () => this.checkLpBalance(), 'bg-blue-600 hover:bg-blue-700')}
                ${UI.createButton('Remove Liquidity', () => this.removeLiquidity(), 'bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90')}
            </div>
        `;
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
    }
});