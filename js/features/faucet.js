// ======================
// FAUCET FEATURE
// ======================
FeatureRegistry.register({
    id: 'faucet',
    name: 'Faucet',
    icon: '💧',
    order: 6,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Claim from Faucet</h3>
            <p class="text-gray-600 mb-6">Get test tokens for the Tempo Moderato testnet</p>
            ${UI.createButton('💧 Claim Tokens', () => this.claimFaucet(), 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90')}
        `;
    },

    async claimFaucet() {
        UI.showStatus('Claiming from faucet...', 'info');

        try {
            // Use the OLD public testnet RPC which still hosts the working faucet
            const FAUCET_RPC = 'https://rpc.moderato.tempo.xyz';
            const faucetProvider = new ethers.providers.JsonRpcProvider(FAUCET_RPC);

            const txHashes = await faucetProvider.send('tempo_fundAddress', [TempoApp.account]);

            const txDisplay = Array.isArray(txHashes) 
                ? txHashes.join(', ')
                : txHashes;

            UI.showStatus(
                `Faucet claimed successfully! You should receive 1,000,000 of each: AlphaUSD, BetaUSD, ThetaUSD, PathUSD TX: ${txDisplay}`,
                'success'
            );

            // Refresh balances after a short delay
            setTimeout(() => {
                const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
                if (dashboard && dashboard.loadBalances) {
                    dashboard.loadBalances();
                }
            }, 4000);

        } catch (error) {
            let message = error.message || 'Unknown error';

            if (message.includes('rate limit') || message.includes('too many requests')) {
                UI.showStatus(
                    'Faucet is rate limited — please wait 1-2 hours and try again',
                    'warning'
                );
            } else if (message.toLowerCase().includes('already claimed') || message.includes('cooldown')) {
                UI.showStatus(
                    'You have already claimed recently — please try again later',
                    'warning'
                );
            } else if (message.includes('handler') || message.includes('method not found')) {
                UI.showStatus(
                    'Faucet temporarily unavailable on this network. Please try again later.',
                    'error'
                );
            } else {
                UI.showStatus(`Claim failed: ${message}`, 'error');
            }

            console.error('Faucet error:', error);
        }
    }
});
