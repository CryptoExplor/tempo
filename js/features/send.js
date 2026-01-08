// ======================
// SEND FEATURE
// ======================
FeatureRegistry.register({
    id: 'send',
    name: 'Send',
    icon: '📤',
    order: 3,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Send Tokens</h3>
            <div class="space-y-4">
                ${UI.createTokenSelect('sendToken')}
                ${UI.createAddressInput('sendRecipient', 'Recipient Address')}
                ${UI.createAmountInput('sendAmount', 'Amount', '1')}
                ${UI.createButton('Send', () => this.sendToken(), 'bg-blue-600 hover:bg-blue-700')}
            </div>
        `;
    },

    async sendToken() {
        const tokenSymbol = UI.getInputValue('sendToken');
        const recipient = UI.getInputValue('sendRecipient');
        const amount = UI.getInputValue('sendAmount');

        if (!recipient || !amount || !ethers.utils.isAddress(recipient)) {
            UI.showStatus('Please fill all fields with valid data', 'error');
            return;
        }

        UI.showStatus('Sending token...', 'info');
        try {
            const tokenAddress = CONFIG.TOKENS[tokenSymbol];
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, TempoApp.signer);
            const decimals = await contract.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            const tx = await contract.transfer(recipient, amountWei);
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('Transfer successful!', 'success');
            
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) dashboard.loadBalances();
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});