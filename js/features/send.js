// Enhanced Send Feature (merged with Memo Transfer)
FeatureRegistry.register({
    id: 'send',
    name: 'Send',
    icon: '📤',
    order: 3,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Send Tokens</h3>
            <p class="text-gray-600 mb-6">Send tokens with optional memo message</p>
            
            <div class="space-y-4">
                ${UI.createTokenSelect('sendToken', 'Select Token')}
                
                ${UI.createAddressInput('sendRecipient', 'Recipient Address')}
                
                ${UI.createAmountInput('sendAmount', 'Amount', '1')}
                
                <!-- Memo Section -->
                <div class="border-t pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium">Memo Message (Optional)</label>
                        <button id="generateRandomMemo" class="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors">
                            🎲 Generate Random
                        </button>
                    </div>
                    <input type="text" 
                           id="sendMemo" 
                           placeholder="e.g., Payment for services, Thanks!, etc."
                           maxlength="32"
                           class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">
                        <span id="memoCharCount">0</span>/32 characters (stored permanently on-chain)
                    </p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-blue-900 mb-2">💡 About Memos</div>
                    <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Optional - leave blank for regular transfer</li>
                        <li>Max 32 characters, stored permanently on-chain</li>
                        <li>Useful for payment references or notes</li>
                        <li>Anyone can read memos on the blockchain</li>
                    </ul>
                </div>

                ${UI.createButton('Send Transfer', () => this.sendToken(), 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90')}
            </div>

            <!-- Recent Transfers -->
            <div id="recentTransfers" class="hidden mt-6">
                <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Transfers</h4>
                <div id="transfersList" class="space-y-2"></div>
            </div>
        `;
    },

    init() {
        // Memo character counter
        const memoInput = document.getElementById('sendMemo');
        const charCount = document.getElementById('memoCharCount');
        
        if (memoInput && charCount) {
            memoInput.addEventListener('input', () => {
                charCount.textContent = memoInput.value.length;
            });
        }

        // Random memo generator
        const generateBtn = document.getElementById('generateRandomMemo');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateRandomMemo());
        }
    },

    generateRandomMemo() {
        const memoTemplates = [
            "Payment #{ID}",
            "Invoice #{ID}",
            "Thanks! 🎉",
            "Payment for services",
            "Order #{ID}",
            "Tip 💰",
            "Refund #{ID}",
            "Donation ❤️",
            "Contribution",
            "Support",
            "Gift 🎁",
            "Reward #{ID}",
            "Bounty payment",
            "Transaction #{ID}",
            "Settlement #{ID}"
        ];

        const template = memoTemplates[Math.floor(Math.random() * memoTemplates.length)];
        const randomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        const memo = template.replace('{ID}', randomId);

        const memoInput = document.getElementById('sendMemo');
        if (memoInput) {
            memoInput.value = memo;
            document.getElementById('memoCharCount').textContent = memo.length;
        }

        UI.showStatus('Random memo generated!', 'success');
    },

    async sendToken() {
        const tokenSymbol = UI.getInputValue('sendToken');
        const recipient = UI.getInputValue('sendRecipient');
        const amount = UI.getInputValue('sendAmount');
        const memo = document.getElementById('sendMemo').value;

        if (!recipient || !ethers.utils.isAddress(recipient)) {
            UI.showStatus('Please enter a valid recipient address', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        const hasMemo = memo && memo.trim().length > 0;
        UI.showStatus(hasMemo ? 'Sending with memo...' : 'Sending transfer...', 'info');

        try {
            const tokenAddress = CONFIG.TOKENS[tokenSymbol];
            
            const ABI = hasMemo ? [
                "function decimals() view returns (uint8)",
                "function balanceOf(address owner) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function transferWithMemo(address to, uint256 amount, bytes32 memo)"
            ] : ERC20_ABI;

            const contract = new ethers.Contract(tokenAddress, ABI, TempoApp.signer);
            const decimals = await contract.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            // Check balance
            const balance = await contract.balanceOf(TempoApp.account);
            if (balance.lt(amountWei)) {
                UI.showStatus('Insufficient balance', 'error');
                return;
            }

            let tx;

            if (hasMemo) {
                // Send with memo
                const utf8Bytes = ethers.utils.toUtf8Bytes(memo);
                let memoBytes32;
                
                if (utf8Bytes.length > 32) {
                    const truncated = new Uint8Array(32);
                    truncated.set(utf8Bytes.slice(0, 32));
                    memoBytes32 = ethers.utils.hexlify(truncated);
                } else {
                    const padded = new Uint8Array(32);
                    padded.set(utf8Bytes);
                    memoBytes32 = ethers.utils.hexlify(padded);
                }

                try {
                    tx = await contract.transferWithMemo(recipient, amountWei, memoBytes32);
                } catch (error) {
                    if (error.message.includes('transferWithMemo')) {
                        UI.showStatus('This token does not support memos. Sending regular transfer...', 'warning');
                        tx = await contract.transfer(recipient, amountWei);
                    } else {
                        throw error;
                    }
                }
            } else {
                // Regular transfer
                tx = await contract.transfer(recipient, amountWei);
            }

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToRecentTransfers(tx.hash, tokenSymbol, amount, recipient, memo);
            UI.showStatus('Transfer completed successfully!', 'success');

            // Clear inputs
            UI.setInputValue('sendRecipient', '');
            UI.setInputValue('sendAmount', '1');
            document.getElementById('sendMemo').value = '';
            document.getElementById('memoCharCount').textContent = '0';

            // Refresh dashboard
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                setTimeout(() => dashboard.loadBalances(), 2000);
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    addToRecentTransfers(txHash, token, amount, recipient, memo) {
        const recentTransfers = document.getElementById('recentTransfers');
        const transfersList = document.getElementById('transfersList');
        
        recentTransfers.classList.remove('hidden');

        const transferDiv = document.createElement('div');
        transferDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-3 fade-in';
        
        let content = `
            <div class="flex items-center justify-between ${memo ? 'mb-2' : ''}">
                <div>
                    <div class="text-sm font-medium text-green-800">
                        ${amount} ${token} sent
                    </div>
                    <div class="text-xs text-green-600">
                        To: ${recipient.slice(0, 10)}...${recipient.slice(-8)}
                    </div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;

        if (memo) {
            content += `
                <div class="bg-white rounded p-2 border border-green-100">
                    <div class="text-xs text-gray-500 mb-1">Memo:</div>
                    <div class="text-sm text-gray-800 font-mono">"${memo}"</div>
                </div>
            `;
        }

        transferDiv.innerHTML = content;
        transfersList.insertBefore(transferDiv, transfersList.firstChild);

        // Keep only last 5 transfers
        while (transfersList.children.length > 5) {
            transfersList.removeChild(transfersList.lastChild);
        }
    }
});