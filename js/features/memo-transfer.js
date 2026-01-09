// Transfer with Memo Feature
FeatureRegistry.register({
    id: 'memo-transfer',
    name: 'Memo Transfer',
    icon: '📝',
    order: 19,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Transfer with Memo</h3>
            <p class="text-gray-600 mb-6">Send tokens with an attached message (max 32 bytes)</p>
            
            <div class="space-y-4">
                ${UI.createTokenSelect('memoToken', 'Select Token')}
                
                ${UI.createAddressInput('memoRecipient', 'Recipient Address')}
                
                ${UI.createAmountInput('memoAmount', 'Amount', '0.01')}
                
                <div>
                    <label class="block text-sm font-medium mb-2">Memo Message</label>
                    <input type="text" 
                           id="memoText" 
                           placeholder="e.g., Payment for services"
                           maxlength="32"
                           class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">
                        <span id="memoCharCount">0</span>/32 characters
                    </p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-blue-900 mb-2">💡 About Memos</div>
                    <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Memos are stored permanently on-chain</li>
                        <li>Maximum 32 characters (bytes)</li>
                        <li>Useful for payment references, notes, or IDs</li>
                        <li>Anyone can read the memo on the blockchain</li>
                    </ul>
                </div>

                <div id="memoPreview" class="hidden bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Preview</div>
                    <div id="memoPreviewContent" class="text-sm text-gray-600"></div>
                </div>

                ${UI.createButton('Send with Memo', () => this.sendWithMemo(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
            </div>

            <!-- Recent Transfers -->
            <div id="recentMemoTransfers" class="hidden mt-6">
                <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Transfers</h4>
                <div id="memoTransfersList" class="space-y-2"></div>
            </div>
        `;
    },

    init() {
        const memoInput = document.getElementById('memoText');
        const charCount = document.getElementById('memoCharCount');
        const preview = document.getElementById('memoPreview');
        const previewContent = document.getElementById('memoPreviewContent');

        if (memoInput && charCount) {
            memoInput.addEventListener('input', () => {
                const length = memoInput.value.length;
                charCount.textContent = length;
                
                // Show preview if there's text
                if (length > 0 && preview && previewContent) {
                    preview.classList.remove('hidden');
                    const recipient = UI.getInputValue('memoRecipient');
                    const amount = UI.getInputValue('memoAmount');
                    const token = UI.getInputValue('memoToken');
                    
                    previewContent.innerHTML = `
                        <div class="space-y-1">
                            <div><strong>To:</strong> ${recipient || '(not set)'}</div>
                            <div><strong>Amount:</strong> ${amount || '0'} ${token}</div>
                            <div><strong>Memo:</strong> "${memoInput.value}"</div>
                        </div>
                    `;
                } else if (preview) {
                    preview.classList.add('hidden');
                }
            });
        }
    },

    async sendWithMemo() {
        const tokenSymbol = UI.getInputValue('memoToken');
        const recipient = UI.getInputValue('memoRecipient');
        const amount = UI.getInputValue('memoAmount');
        const memoText = document.getElementById('memoText').value;

        if (!recipient || !ethers.utils.isAddress(recipient)) {
            UI.showStatus('Please enter a valid recipient address', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        if (!memoText) {
            UI.showStatus('Please enter a memo message', 'error');
            return;
        }

        UI.showStatus('Preparing transfer with memo...', 'info');

        try {
            const tokenAddress = CONFIG.TOKENS[tokenSymbol];
            
            const TIP20_EXTENDED_ABI = [
                "function decimals() view returns (uint8)",
                "function balanceOf(address owner) view returns (uint256)",
                "function transferWithMemo(address to, uint256 amount, bytes32 memo)"
            ];

            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_EXTENDED_ABI,
                TempoApp.signer
            );

            const decimals = await tokenContract.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            // Check balance
            const balance = await tokenContract.balanceOf(TempoApp.account);
            if (balance.lt(amountWei)) {
                UI.showStatus('Insufficient balance', 'error');
                return;
            }

            // Encode memo to bytes32
            const utf8Bytes = ethers.utils.toUtf8Bytes(memoText);
            let memoBytes32;
            
            if (utf8Bytes.length > 32) {
                UI.showStatus('Memo too long. Truncating to 32 bytes...', 'warning');
                const truncated = new Uint8Array(32);
                truncated.set(utf8Bytes.slice(0, 32));
                memoBytes32 = ethers.utils.hexlify(truncated);
            } else {
                // Right-pad with zeros
                const padded = new Uint8Array(32);
                padded.set(utf8Bytes);
                memoBytes32 = ethers.utils.hexlify(padded);
            }

            UI.showStatus('Sending transfer with memo...', 'info');
            const tx = await tokenContract.transferWithMemo(
                recipient,
                amountWei,
                memoBytes32
            );

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToRecentTransfers(tx.hash, tokenSymbol, amount, recipient, memoText);
            UI.showStatus('Transfer with memo completed successfully!', 'success');

            // Clear inputs
            UI.setInputValue('memoRecipient', '');
            UI.setInputValue('memoAmount', '0.01');
            document.getElementById('memoText').value = '';
            document.getElementById('memoCharCount').textContent = '0';
            document.getElementById('memoPreview').classList.add('hidden');

            // Refresh dashboard
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                setTimeout(() => dashboard.loadBalances(), 2000);
            }
        } catch (error) {
            if (error.message.includes('transferWithMemo')) {
                UI.showStatus('This token may not support memo transfers', 'error');
            } else {
                UI.showStatus(`Error: ${error.message}`, 'error');
            }
        }
    },

    addToRecentTransfers(txHash, token, amount, recipient, memo) {
        const recentTransfers = document.getElementById('recentMemoTransfers');
        const transfersList = document.getElementById('memoTransfersList');
        
        recentTransfers.classList.remove('hidden');

        const transferDiv = document.createElement('div');
        transferDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-3 fade-in';
        transferDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
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
            <div class="bg-white rounded p-2 border border-green-100">
                <div class="text-xs text-gray-500 mb-1">Memo:</div>
                <div class="text-sm text-gray-800 font-mono">"${memo}"</div>
            </div>
        `;
        
        transfersList.insertBefore(transferDiv, transfersList.firstChild);

        // Keep only last 5 transfers
        while (transfersList.children.length > 5) {
            transfersList.removeChild(transfersList.lastChild);
        }
    }
});