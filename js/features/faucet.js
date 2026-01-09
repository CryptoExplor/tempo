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
            <p class="text-gray-600 mb-6">
                Get test tokens for the Tempo Moderato testnet
            </p>
            ${UI.createButton(
                '💧 Claim Tokens',
                () => this.claimFaucet(),
                'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90'
            )}
        `;
    },

    async claimFaucet() {
        UI.showStatus('Claiming from faucet...', 'info');

        try {
            // RPC that still supports the faucet
            const FAUCET_RPC = 'https://rpc.moderato.tempo.xyz';
            const EXPLORER_TX = 'https://explore.tempo.xyz/tx/';

            const faucetProvider = new ethers.providers.JsonRpcProvider(FAUCET_RPC);

            const txHashes = await faucetProvider.send(
                'tempo_fundAddress',
                [TempoApp.account]
            );

            // Normalize to array
            const hashes = Array.isArray(txHashes) ? txHashes : [txHashes];

            // Build clickable explorer links
            const txLinks = hashes
                .map(tx => `
                    <a
                        href="${EXPLORER_TX}${tx}"
                        target="_blank"
                        class="text-blue-600 underline hover:text-blue-800"
                    >
                        ${tx.slice(0, 10)}...${tx.slice(-8)}
                    </a>
                `)
                .join('<br>');

            UI.showStatus(
                `
                <strong>Faucet claimed successfully!</strong><br>
                You should receive <b>1,000,000</b> of each token:<br>
                AlphaUSD, BetaUSD, ThetaUSD, PathUSD<br><br>
                <strong>Transaction${hashes.length > 1 ? 's' : ''}:</strong><br>
                ${txLinks}
                `,
                'success'
            );

            // Refresh balances after a short delay (safe-guarded in dashboard)
            setTimeout(() => {
                const dashboard = FeatureRegistry.features.find(
                    f => f.id === 'dashboard'
                );
                if (dashboard && dashboard.loadBalances) {
                    dashboard.loadBalances();
                }
            }, 4000);

        } catch (error) {
            const message = error.message || 'Unknown error';

            if (
                message.includes('rate limit') ||
                message.includes('too many requests')
            ) {
                UI.showStatus(
                    'Faucet is rate limited — please wait 1–2 hours and try again',
                    'warning'
                );
            } else if (
                message.toLowerCase().includes('already claimed') ||
                message.toLowerCase().includes('cooldown')
            ) {
                UI.showStatus(
                    'You have already claimed recently — please try again later',
                    'warning'
                );
            } else if (
                message.includes('handler') ||
                message.includes('method not found')
            ) {
                UI.showStatus(
                    'Faucet temporarily unavailable on this network. Please try again later.',
                    'error'
                );
            } else {
                UI.showStatus(`Claim failed: ${message}`, 'error');
            }

            console.error('[Faucet] error:', error);
        }
    }
});
