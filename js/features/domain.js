// ======================
// DOMAIN FEATURE
// ======================
FeatureRegistry.register({
    id: 'domain',
    name: 'Domain',
    icon: '🌐',
    order: 8,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Register Domain</h3>
            <p class="text-gray-600 mb-4">Register a .tempo domain name</p>
            <div class="space-y-4">
                <div class="flex gap-2">
                    ${UI.createInput('domainName', 'Enter domain name')}
                    <div class="flex items-center px-4 bg-gray-100 rounded-lg">.tempo</div>
                </div>
                ${UI.createButton('Register Domain', () => this.registerDomain(), 'bg-cyan-600 hover:bg-cyan-700')}
            </div>
        `;
    },

    async registerDomain() {
        const domainName = UI.getInputValue('domainName').toLowerCase();

        if (!domainName) {
            UI.showStatus('Please enter a domain name', 'error');
            return;
        }

        UI.showStatus('Registering domain...', 'info');
        try {
            const infinity = new ethers.Contract(CONFIG.INFINITY_NAME_CONTRACT, INFINITY_NAME_ABI, TempoApp.signer);
            const pathUsd = new ethers.Contract(CONFIG.TOKENS.PathUSD, ERC20_ABI, TempoApp.signer);

            const decimals = await pathUsd.decimals();
            const amount = ethers.utils.parseUnits("1000", decimals);

            await TempoApp.approveToken(CONFIG.TOKENS.PathUSD, CONFIG.INFINITY_NAME_CONTRACT, amount);

            UI.showStatus('Registering domain...', 'info');
            const tx = await infinity.register(domainName, ethers.constants.AddressZero);
            UI.showStatus(`TX: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus(`Domain ${domainName}.tempo registered!`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});