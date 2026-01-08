// Batch Transfer Feature
FeatureRegistry.register({
    id: 'batch-transfer',
    name: 'Batch Transfer',
    icon: '📦',
    order: 12,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Batch Transfer</h3>
            <p class="text-gray-600 mb-6">Send tokens to multiple addresses at once</p>
            
            <div class="space-y-4">
                ${UI.createTokenSelect('batchToken', 'Select Token')}
                
                <div>
                    <label class="block text-sm font-medium mb-2">Recipients & Amounts</label>
                    <textarea id="batchRecipients" 
                        placeholder="Enter one per line:&#10;0x123..., 10&#10;0x456..., 20&#10;0x789..., 15"
                        rows="6"
                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Format: address, amount (one per line)</p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-blue-900 mb-2">Preview</div>
                    <div id="batchPreview" class="text-sm text-blue-700">
                        Enter recipients to see preview
                    </div>
                </div>

                ${UI.createButton('Send Batch Transfer', () => this.executeBatchTransfer(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
            </div>
        `;
    },

    init() {
        const textarea = document.getElementById('batchRecipients');
        if (textarea) {
            textarea.addEventListener('input', () => this.updatePreview());
        }
    },

    parseRecipients() {
        const text = UI.getInputValue('batchRecipients');
        const lines = text.split('\n').filter(l => l.trim());
        const recipients = [];

        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length === 2) {
                const [address, amount] = parts;
                if (ethers.utils.isAddress(address) && !isNaN(parseFloat(amount))) {
                    recipients.push({ address, amount: parseFloat(amount) });
                }
            }
        }

        return recipients;
    },

    updatePreview() {
        const recipients = this.parseRecipients();
        const preview = document.getElementById('batchPreview');
        
        if (recipients.length === 0) {
            preview.innerHTML = 'Enter recipients to see preview';
            return;
        }

        const total = recipients.reduce((sum, r) => sum + r.amount, 0);
        preview.innerHTML = `
            <div class="font-semibold">${recipients.length} recipients</div>
            <div>Total amount: ${total.toFixed(2)}</div>
        `;
    },

    async executeBatchTransfer() {
        const tokenSymbol = UI.getInputValue('batchToken');
        const recipients = this.parseRecipients();

        if (recipients.length === 0) {
            UI.showStatus('Please enter valid recipients', 'error');
            return;
        }

        UI.showStatus(`Sending to ${recipients.length} recipients...`, 'info');

        try {
            const tokenAddress = CONFIG.TOKENS[tokenSymbol];
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, TempoApp.signer);
            const decimals = await contract.decimals();

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < recipients.length; i++) {
                const { address, amount } = recipients[i];
                
                try {
                    UI.showStatus(`Sending to ${address} (${i + 1}/${recipients.length})...`, 'info');
                    
                    const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
                    const tx = await contract.transfer(address, amountWei);
                    await tx.wait();
                    
                    successCount++;
                } catch (error) {
                    console.error(`Failed to send to ${address}:`, error);
                    failCount++;
                }

                // Small delay between transactions
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            UI.showStatus(
                `Batch transfer complete! Success: ${successCount}, Failed: ${failCount}`,
                failCount === 0 ? 'success' : 'warning'
            );

            // Refresh dashboard if it's visible
            const dashboardFeature = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboardFeature && dashboardFeature.loadBalances) {
                setTimeout(() => dashboardFeature.loadBalances(), 2000);
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});