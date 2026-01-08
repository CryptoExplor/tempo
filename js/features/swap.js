// ======================
// SWAP FEATURE
// ======================
FeatureRegistry.register({
    id: 'swap',
    name: 'Swap',
    icon: '🔄',
    order: 5,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Swap Tokens</h3>
            <div class="space-y-4">
                ${UI.createTokenSelect('swapTokenIn', 'From')}
                <div class="flex justify-center text-gray-400 text-2xl">⇅</div>
                ${UI.createTokenSelect('swapTokenOut', 'To')}
                ${UI.createAmountInput('swapAmount', 'Amount', '1')}
                ${UI.createButton('Swap', () => this.swapTokens(), 'bg-purple-600 hover:bg-purple-700')}
            </div>
        `;
    },

    async swapTokens() {
        const tokenInSymbol = UI.getInputValue('swapTokenIn');
        const tokenOutSymbol = UI.getInputValue('swapTokenOut');
        const amount = UI.getInputValue('swapAmount');

        if (tokenInSymbol === tokenOutSymbol) {
            UI.showStatus('Please select different tokens', 'error');
            return;
        }

        UI.showStatus('Swapping tokens...', 'info');
        try {
            const tokenIn = CONFIG.TOKENS[tokenInSymbol];
            const tokenOut = CONFIG.TOKENS[tokenOutSymbol];
            const dex = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, TempoApp.signer);
            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, TempoApp.signer);

            const decimals = await tokenInContract.decimals();
            const amountIn = ethers.utils.parseUnits(amount, decimals);

            await TempoApp.approveToken(tokenIn, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountIn);

            const expectedOut = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
            const minOut = expectedOut.mul(99).div(100);

            UI.showStatus('Executing swap...', 'info');
            const tx = await dex.swapExactAmountIn(tokenIn, tokenOut, amountIn, minOut);
            UI.showStatus(`Swap TX: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('Swap successful!', 'success');
            
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) dashboard.loadBalances();
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});