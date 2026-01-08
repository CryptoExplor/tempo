// ======================
// FAUCET FEATURE
// ======================
FeatureRegistry.register({
    id: 'faucet',
    name: 'Faucet',
    icon: '💧',
    order: 2,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Claim from Faucet</h3>
            <p class="text-gray-600 mb-6">Get test tokens for the Tempo testnet</p>
            ${UI.createButton('💧 Claim Tokens', () => this.claimFaucet(), 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90')}
        `;
    },

    async claimFaucet() {
        UI.showStatus('Claiming from faucet...', 'info');
        try {
            const txHashes = await TempoApp.provider.send('tempo_fundAddress', [TempoApp.account]);
            UI.showStatus(`Faucet claimed! TX: ${Array.isArray(txHashes) ? txHashes[0] : txHashes}`, 'success');
            setTimeout(() => {
                const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
                if (dashboard && dashboard.loadBalances) dashboard.loadBalances();
            }, 3000);
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});
