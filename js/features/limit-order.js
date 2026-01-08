// ======================
// LIMIT ORDER FEATURE
// ======================
FeatureRegistry.register({
    id: 'limit',
    name: 'Limit Order',
    icon: '📈',
    order: 7,
    orderType: true,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Limit Order</h3>
            <div class="space-y-4">
                ${UI.createTokenSelect('limitToken')}
                ${UI.createAmountInput('limitAmount', 'Amount', '10')}
                <div class="flex gap-2">
                    <button id="bidBtn" class="flex-1 py-3 rounded-lg font-semibold bg-green-600 text-white">
                        BID (Buy)
                    </button>
                    <button id="askBtn" class="flex-1 py-3 rounded-lg font-semibold bg-gray-200">
                        ASK (Sell)
                    </button>
                </div>
                ${UI.createButton('Place Order', () => this.placeLimitOrder(), 'bg-orange-600 hover:bg-orange-700')}
            </div>
        `;
    },

    init() {
        const bidBtn = document.getElementById('bidBtn');
        const askBtn = document.getElementById('askBtn');
        
        if (bidBtn) bidBtn.onclick = () => this.setOrderType(true);
        if (askBtn) askBtn.onclick = () => this.setOrderType(false);
    },

    setOrderType(isBid) {
        this.orderType = isBid;
        const bidBtn = document.getElementById('bidBtn');
        const askBtn = document.getElementById('askBtn');

        if (bidBtn && askBtn) {
            if (isBid) {
                bidBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-green-600 text-white';
                askBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gray-200';
            } else {
                bidBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-gray-200';
                askBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-red-600 text-white';
            }
        }
    },

    async placeLimitOrder() {
        const tokenSymbol = UI.getInputValue('limitToken');
        const amount = UI.getInputValue('limitAmount');

        UI.showStatus('Placing order...', 'info');
        try {
            const token = CONFIG.TOKENS[tokenSymbol];
            const dex = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, TempoApp.signer);

            const tokenToApprove = this.orderType ? CONFIG.TOKENS.PathUSD : token;
            const amountWei = ethers.utils.parseUnits(amount, 6);

            await TempoApp.approveToken(tokenToApprove, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountWei);

            UI.showStatus('Placing order...', 'info');
            const tx = await dex.place(token, amountWei, this.orderType, 0, { gasLimit: 3000000 });
            UI.showStatus(`TX: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('Order placed!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});