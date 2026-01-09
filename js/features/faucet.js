// ======================
// UI HELPERS
// ======================
const UI = {
    showStatus(message, type = 'info') {
        const el = document.getElementById('status');
        if (!el) return;

        const baseClass = 'rounded-lg p-4 mt-4 text-sm leading-relaxed';

        const typeClass = {
            success: 'bg-green-100 text-green-800 border border-green-300',
            error: 'bg-red-100 text-red-800 border border-red-300',
            warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
            info: 'bg-blue-100 text-blue-800 border border-blue-300'
        }[type] || '';

        el.className = `${baseClass} ${typeClass}`;
        el.innerHTML = message; // HTML rendering enabled
    },

    showLoading(id, text = 'Loading...') {
        const el = document.getElementById(id);
        if (!el) return;

        el.innerHTML = `
            <div class="flex items-center gap-2 text-gray-500 text-sm">
                <span class="animate-spin">⏳</span>
                <span>${text}</span>
            </div>
        `;
    },

    createButton(label, onClick, className = '') {
        const id = `btn-${Math.random().toString(36).slice(2)}`;
        setTimeout(() => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = onClick;
        }, 0);

        return `
            <button
                id="${id}"
                class="px-4 py-2 rounded-lg font-semibold transition-all ${className}"
            >
                ${label}
            </button>
        `;
    },

    createCard(title, value) {
        return `
            <div class="bg-white rounded-xl p-4 border border-gray-200">
                <div class="text-sm text-gray-500 mb-1">${title}</div>
                <div class="text-xl font-bold text-gray-900">${value}</div>
            </div>
        `;
    }
};


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
            const FAUCET_RPC = 'https://rpc.moderato.tempo.xyz';
            const EXPLORER_TX = 'https://explore.tempo.xyz/tx/';

            const faucetProvider = new ethers.providers.JsonRpcProvider(FAUCET_RPC);

            const txHashes = await faucetProvider.send(
                'tempo_fundAddress',
                [TempoApp.account]
            );

            const hashes = Array.isArray(txHashes) ? txHashes : [txHashes];

            const txLinks = hashes
                .map(tx =>
                    `<a href="${EXPLORER_TX}${tx}" target="_blank"
                        class="text-blue-600 underline hover:text-blue-800">
                        ${tx.slice(0, 10)}...${tx.slice(-8)}
                    </a>`
                )
                .join('<br>');

            const successHtml =
                `<strong>Faucet claimed successfully!</strong><br>` +
                `You should receive <b>1,000,000</b> of each token:<br>` +
                `AlphaUSD, BetaUSD, ThetaUSD, PathUSD<br><br>` +
                `<strong>Transaction${hashes.length > 1 ? 's' : ''}:</strong><br>` +
                txLinks;

            UI.showStatus(successHtml, 'success');

            setTimeout(() => {
                const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
                if (dashboard && dashboard.loadBalances) {
                    dashboard.loadBalances();
                }
            }, 4000);

        } catch (error) {
            const message = error.message || 'Unknown error';

            if (message.includes('rate limit') || message.includes('too many requests')) {
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
