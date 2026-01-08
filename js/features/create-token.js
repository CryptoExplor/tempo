// ======================
// CREATE TOKEN FEATURE
// ======================
FeatureRegistry.register({
    id: 'create',
    name: 'Create Token',
    icon: '🪙',
    order: 4,
    createdTokens: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Create Stablecoin</h3>
            <div class="space-y-4">
                ${UI.createInput('tokenName', 'Token Name (e.g., Alpha Dollar)')}
                ${UI.createInput('tokenSymbol', 'Symbol (e.g., AUSD)')}
                ${UI.createButton('Create Token', () => this.createToken(), 'bg-green-600 hover:bg-green-700')}
                <div id="createdTokens" class="mt-6 space-y-2"></div>
            </div>
        `;
    },

    async createToken() {
        const name = UI.getInputValue('tokenName');
        const symbol = UI.getInputValue('tokenSymbol');

        if (!name || !symbol) {
            UI.showStatus('Please fill all fields', 'error');
            return;
        }

        UI.showStatus('Creating token...', 'info');
        try {
            const factory = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.TIP20_FACTORY, TIP20_FACTORY_ABI, TempoApp.signer);
            const tx = await factory.createToken(name, symbol, "USD", CONFIG.TOKENS.PathUSD, TempoApp.account);
            UI.showStatus(`Creation TX: ${tx.hash}`, 'info');
            const receipt = await tx.wait();

            for (const log of receipt.logs) {
                try {
                    const parsed = factory.interface.parseLog(log);
                    if (parsed && parsed.name === 'TokenCreated') {
                        const tokenAddress = parsed.args.token;
                        UI.showStatus(`Token created at: ${tokenAddress}`, 'success');
                        this.createdTokens.push({ address: tokenAddress, symbol, name });
                        this.displayCreatedTokens();
                        return;
                    }
                } catch (e) { continue; }
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    displayCreatedTokens() {
        const container = document.getElementById('createdTokens');
        if (!container || this.createdTokens.length === 0) return;

        container.innerHTML = '<h4 class="font-semibold text-gray-700">Your Tokens:</h4>';
        this.createdTokens.forEach(token => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-3 rounded-lg fade-in';
            div.innerHTML = `
                <div class="font-medium">${token.name} (${token.symbol})</div>
                <div class="text-sm text-gray-500 break-all">${token.address}</div>
            `;
            container.appendChild(div);
        });
    }
});