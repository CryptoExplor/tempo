// Mint Tokens Feature
FeatureRegistry.register({
    id: 'mint-tokens',
    name: 'Mint Tokens',
    icon: '🏭',
    order: 8,
    userTokens: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Mint Tokens</h3>
            <p class="text-gray-600 mb-6">Mint additional supply of your created tokens</p>
            
            <div class="space-y-6">
                <!-- Load Tokens -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Your Created Tokens</h4>
                    <div id="mintUserTokensList" class="mb-4 space-y-2">
                        <div class="text-sm text-gray-500">Click "Load My Tokens" to scan for tokens you've created</div>
                    </div>
                    ${UI.createButton('Load My Tokens', () => this.loadUserTokens(), 'bg-blue-600 hover:bg-blue-700')}
                </div>

                <!-- Mint Interface -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Mint Tokens</h4>
                    <div class="space-y-4">
                        <div id="mintTokenSelectContainer">
                            <p class="text-sm text-gray-500">Load your tokens first</p>
                        </div>

                        ${UI.createAmountInput('mintAmount', 'Amount to Mint', '1000')}
                        ${UI.createAddressInput('mintRecipient', 'Recipient Address (leave empty for yourself)')}

                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-yellow-900 mb-2">⚠️ Requirements</div>
                            <ul class="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                <li>You must have ISSUER_ROLE on the token</li>
                                <li>Token must not be paused</li>
                                <li>Check the Grant Role feature if you need permissions</li>
                            </ul>
                        </div>

                        ${UI.createButton('Mint Tokens', () => this.mintTokens(), 'bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90')}
                    </div>
                </div>

                <!-- Recent Mints -->
                <div id="recentMints" class="hidden">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Mints</h4>
                    <div id="mintsList" class="space-y-2"></div>
                </div>
            </div>
        `;
    },

    async loadUserTokens() {
        UI.showStatus('Scanning for your created tokens...', 'info');
        
        try {
            const factory = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.TIP20_FACTORY,
                TIP20_FACTORY_ABI,
                TempoApp.provider
            );

            const filter = factory.filters.TokenCreated(null, null, null, null, null, TempoApp.account);
            const events = await factory.queryFilter(filter);

            this.userTokens = [];
            const tokensList = document.getElementById('mintUserTokensList');
            tokensList.innerHTML = '';

            if (events.length === 0) {
                tokensList.innerHTML = '<div class="text-sm text-yellow-600">No tokens found. Create a token first.</div>';
                UI.showStatus('No tokens found for your address', 'warning');
                return;
            }

            for (const event of events) {
                const tokenAddress = event.args.token;
                
                try {
                    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, TempoApp.provider);
                    const symbol = await tokenContract.symbol();
                    
                    this.userTokens.push({
                        address: tokenAddress,
                        symbol: symbol
                    });

                    const tokenDiv = document.createElement('div');
                    tokenDiv.className = 'bg-gray-50 p-3 rounded-lg fade-in';
                    tokenDiv.innerHTML = `
                        <div class="font-medium text-gray-800">${symbol}</div>
                        <div class="text-xs text-gray-500 break-all">${tokenAddress}</div>
                    `;
                    tokensList.appendChild(tokenDiv);
                } catch (err) {
                    console.error('Error loading token:', err);
                }
            }

            const tokenSelectContainer = document.getElementById('mintTokenSelectContainer');
            const options = this.userTokens.map(token => ({
                value: token.address,
                label: token.symbol
            }));
            
            tokenSelectContainer.innerHTML = UI.createSelect('mintTokenAddress', options, 'Select Token');

            UI.showStatus(`Found ${this.userTokens.length} token(s)`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async mintTokens() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('mintTokenAddress');
        const amount = UI.getInputValue('mintAmount');
        let recipient = UI.getInputValue('mintRecipient');

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        if (!recipient || !ethers.utils.isAddress(recipient)) {
            recipient = TempoApp.account;
        }

        UI.showStatus('Minting tokens...', 'info');

        try {
            const TIP20_EXTENDED_ABI = [
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)",
                "function hasRole(bytes32 role, address account) view returns (bool)",
                "function grantRole(bytes32 role, address account)",
                "function mint(address to, uint256 amount)"
            ];

            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_EXTENDED_ABI,
                TempoApp.signer
            );

            const decimals = await tokenContract.decimals();
            const symbol = await tokenContract.symbol();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            // Check for ISSUER_ROLE
            const ISSUER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ISSUER_ROLE"));
            
            try {
                const hasRole = await tokenContract.hasRole(ISSUER_ROLE, TempoApp.account);
                
                if (!hasRole) {
                    UI.showStatus('Attempting to grant ISSUER_ROLE...', 'info');
                    try {
                        const grantTx = await tokenContract.grantRole(ISSUER_ROLE, TempoApp.account, { gasLimit: 200000 });
                        await grantTx.wait();
                        UI.showStatus('ISSUER_ROLE granted, proceeding to mint...', 'info');
                    } catch (grantError) {
                        UI.showStatus('Failed to grant ISSUER_ROLE. You may not have admin permissions.', 'error');
                        return;
                    }
                }
            } catch (roleCheckError) {
                UI.showStatus('Cannot check role. Attempting mint anyway...', 'info');
            }

            UI.showStatus('Minting tokens...', 'info');
            const tx = await tokenContract.mint(recipient, amountWei, { gasLimit: 500000 });
            
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToRecentMints(tx.hash, symbol, amount, recipient);
            UI.showStatus(`Successfully minted ${amount} ${symbol}!`, 'success');
        } catch (error) {
            if (error.message.includes('AccessControl')) {
                UI.showStatus('Access denied. You need ISSUER_ROLE on this token.', 'error');
            } else if (error.message.includes('paused')) {
                UI.showStatus('Token transfers are paused', 'error');
            } else {
                UI.showStatus(`Error: ${error.message}`, 'error');
            }
        }
    },

    addToRecentMints(txHash, symbol, amount, recipient) {
        const recentMints = document.getElementById('recentMints');
        const mintsList = document.getElementById('mintsList');
        
        recentMints.classList.remove('hidden');

        const mintDiv = document.createElement('div');
        mintDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-3 fade-in';
        mintDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-green-800">Minted ${amount} ${symbol}</div>
                    <div class="text-xs text-green-600">To: ${recipient.slice(0, 10)}...${recipient.slice(-8)}</div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;
        
        mintsList.insertBefore(mintDiv, mintsList.firstChild);
    }
});