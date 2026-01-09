// ======================
// LIQUIDITY FEATURE
// ======================
FeatureRegistry.register({
    id: 'liquidity',
    name: 'Liquidity',
    icon: '💧',
    order: 13,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Add Liquidity</h3>
            <div class="space-y-4">
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
                ${UI.createButton('Add Liquidity', () => this.addLiquidity(), 'bg-indigo-600 hover:bg-indigo-700')}
            </div>
        `;
    },

    async addLiquidity() {
        const userToken = UI.getInputValue('liqUserToken');
        const validatorToken = UI.getInputValue('liqValidatorToken');
        const amount = UI.getInputValue('liqAmount');

        UI.showStatus('Adding liquidity...', 'info');
        try {
            const feeManager = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, FEE_MANAGER_ABI, TempoApp.signer);
            const valContract = new ethers.Contract(validatorToken, ERC20_ABI, TempoApp.signer);

            const decimals = await valContract.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            await TempoApp.approveToken(validatorToken, CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, amountWei);

            UI.showStatus('Minting liquidity...', 'info');
            const tx = await feeManager.mintWithValidatorToken(userToken, validatorToken, amountWei, TempoApp.account);
            UI.showStatus(`TX: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('Liquidity added!', 'success');
            
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) dashboard.loadBalances();
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});