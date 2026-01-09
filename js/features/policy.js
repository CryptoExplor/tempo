// TIP-403 Policy Management Feature (Enhanced)
// This enhances the existing policy.js with token attachment
FeatureRegistry.register({
    id: 'policy',
    name: 'Policy (TIP-403) ',
    icon: '🔐',
    order: 20,
    userTokens: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Transfer Policy (TIP-403 Advanced)</h3>
            <p class="text-gray-600 mb-6">Create and attach transfer policies to your tokens</p>
            
            <div class="space-y-6">
                <!-- Load User Tokens -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Your Created Tokens</h4>
                    <div id="policyUserTokensList" class="mb-4 space-y-2">
                        <div class="text-sm text-gray-500">Click "Load My Tokens" to see tokens you can manage</div>
                    </div>
                    ${UI.createButton('Load My Tokens', () => this.loadUserTokens(), 'bg-blue-600 hover:bg-blue-700')}
                </div>

                <!-- Create & Attach Policy -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Create & Attach Policy</h4>
                    <div class="space-y-4">
                        <div id="policyTokenSelectContainer">
                            <p class="text-sm text-gray-500">Load your tokens first</p>
                        </div>

                        ${UI.createSelect('policyTypeAdvanced', [
                            { value: '0', label: 'Open (No Restrictions)' },
                            { value: '1', label: 'Whitelist Only' },
                            { value: '2', label: 'Blacklist' }
                        ], 'Policy Type')}

                        <div>
                            <label class="block text-sm font-medium mb-2">Addresses</label>
                            <textarea id="policyAddresses" 
                                placeholder="Enter addresses (one per line) or type 'random 5' for testing"
                                rows="4"
                                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"></textarea>
                        </div>

                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-blue-900 mb-2">📋 Policy Types</div>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li><strong>Open:</strong> No transfer restrictions</li>
                                <li><strong>Whitelist:</strong> Only listed addresses can hold tokens</li>
                                <li><strong>Blacklist:</strong> Listed addresses cannot hold tokens</li>
                            </ul>
                        </div>

                        ${UI.createButton('Create & Attach Policy', () => this.createAndAttachPolicy(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
                    </div>
                </div>

                <!-- Check Current Policy -->
                <div class="border-t pt-6">
                    <h4 class="text-lg font-semibold mb-4">Check Current Policy</h4>
                    <div class="space-y-4">
                        <div id="checkPolicyTokenContainer">
                            <p class="text-sm text-gray-500">Load your tokens first</p>
                        </div>
                        
                        ${UI.createButton('Check Policy', () => this.checkTokenPolicy(), 'bg-green-600 hover:bg-green-700')}
                        
                        <div id="currentPolicyDisplay" class="hidden bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-gray-700 mb-2">Current Policy</div>
                            <div id="policyInfo" class="text-sm text-gray-600"></div>
                        </div>
                    </div>
                </div>

                <!-- Policy History -->
                <div id="policyHistory" class="hidden border-t pt-6">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Policy Changes</h4>
                    <div id="policyChangesList" class="space-y-2"></div>
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
            const tokensList = document.getElementById('policyUserTokensList');
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

            // Update select dropdowns
            const options = this.userTokens.map(token => ({
                value: token.address,
                label: token.symbol
            }));
            
            document.getElementById('policyTokenSelectContainer').innerHTML = 
                UI.createSelect('policyTokenAddress', options, 'Select Token');
            
            document.getElementById('checkPolicyTokenContainer').innerHTML = 
                UI.createSelect('checkPolicyTokenAddress', options, 'Select Token');

            UI.showStatus(`Found ${this.userTokens.length} token(s)`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async createAndAttachPolicy() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('policyTokenAddress');
        const policyType = UI.getInputValue('policyTypeAdvanced');
        const addressesInput = document.getElementById('policyAddresses').value.trim();

        let addresses = [];
        
        if (addressesInput.toLowerCase().startsWith('random')) {
            const count = parseInt(addressesInput.split(' ')[1]) || 5;
            addresses = Array(count).fill(0).map(() => ethers.Wallet.createRandom().address);
            UI.showStatus(`Generated ${count} random addresses`, 'info');
        } else {
            addresses = addressesInput.split('\n')
                .map(a => a.trim())
                .filter(a => a && ethers.utils.isAddress(a));
        }

        if (addresses.length === 0 && policyType !== '0') {
            UI.showStatus('Please enter at least one address for whitelist/blacklist', 'error');
            return;
        }

        UI.showStatus('Creating policy...', 'info');

        try {
            const registry = new ethers.Contract(
                CONFIG.TIP403_REGISTRY,
                TIP403_REGISTRY_ABI,
                TempoApp.signer
            );

            // Create policy
            let tx;
            if (addresses.length > 0) {
                tx = await registry.createPolicyWithAccounts(
                    TempoApp.account,
                    policyType,
                    addresses
                );
            } else {
                tx = await registry.createPolicy(TempoApp.account, policyType);
            }

            UI.showStatus(`Policy creation TX: ${tx.hash}`, 'info');
            const receipt = await tx.wait();

            // Extract policy ID from events
            let policyId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = registry.interface.parseLog(log);
                    if (parsed && parsed.name === 'PolicyCreated') {
                        policyId = parsed.args.policyId.toString();
                        break;
                    }
                } catch (e) { continue; }
            }

            // Fallback: try to extract from raw logs
            if (!policyId && receipt.logs.length > 0) {
                try {
                    // PolicyId is typically in the first indexed parameter
                    const log = receipt.logs[0];
                    if (log.topics.length > 1) {
                        policyId = ethers.BigNumber.from(log.topics[1]).toString();
                    }
                } catch (e) {
                    console.error('Failed to extract policy ID:', e);
                }
            }

            if (!policyId) {
                UI.showStatus('Policy created but could not extract ID. Check transaction.', 'warning');
                return;
            }

            UI.showStatus(`Policy created with ID: ${policyId}`, 'success');

            // Attach policy to token
            UI.showStatus('Attaching policy to token...', 'info');
            
            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_POLICY_ABI,
                TempoApp.signer
            );

            const attachTx = await tokenContract.changeTransferPolicyId(policyId);
            await attachTx.wait();

            const token = this.userTokens.find(t => t.address === tokenAddress);
            this.addToPolicyHistory(token.symbol, policyType, policyId, addresses.length);

            UI.showStatus(`Policy ${policyId} attached to token successfully! 🎉`, 'success');

            // Clear inputs
            document.getElementById('policyAddresses').value = '';

        } catch (error) {
            if (error.message.includes('AccessControl')) {
                UI.showStatus('Access denied. You must be the token admin.', 'error');
            } else {
                UI.showStatus(`Error: ${error.message}`, 'error');
            }
        }
    },

    async checkTokenPolicy() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('checkPolicyTokenAddress');
        const token = this.userTokens.find(t => t.address === tokenAddress);

        UI.showStatus('Checking policy...', 'info');

        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_POLICY_ABI,
                TempoApp.provider
            );

            const policyId = await tokenContract.transferPolicyId();

            const displayDiv = document.getElementById('currentPolicyDisplay');
            const infoDiv = document.getElementById('policyInfo');

            displayDiv.classList.remove('hidden');

            if (policyId.eq(0)) {
                infoDiv.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="text-2xl">🔓</div>
                        <div>
                            <div class="font-semibold">No Policy Set</div>
                            <div class="text-xs">Token has no transfer restrictions</div>
                        </div>
                    </div>
                `;
            } else {
                infoDiv.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="text-2xl">🔐</div>
                        <div>
                            <div class="font-semibold">Policy ID: ${policyId.toString()}</div>
                            <div class="text-xs">Transfer policy is active</div>
                        </div>
                    </div>
                `;
            }

            UI.showStatus('Policy information loaded', 'success');

        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    addToPolicyHistory(tokenSymbol, policyType, policyId, addressCount) {
        const historyDiv = document.getElementById('policyHistory');
        const changesList = document.getElementById('policyChangesList');
        
        historyDiv.classList.remove('hidden');

        const policyTypes = ['Open', 'Whitelist', 'Blacklist'];
        const policyName = policyTypes[parseInt(policyType)] || 'Unknown';

        const changeDiv = document.createElement('div');
        changeDiv.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 fade-in';
        changeDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-blue-800">
                        ${tokenSymbol}: ${policyName} Policy Applied
                    </div>
                    <div class="text-xs text-blue-600">
                        Policy ID: ${policyId} • ${addressCount} address${addressCount !== 1 ? 'es' : ''}
                    </div>
                </div>
                <div class="text-2xl">
                    ${policyType === '0' ? '🔓' : policyType === '1' ? '✅' : '🚫'}
                </div>
            </div>
        `;
        
        changesList.insertBefore(changeDiv, changesList.firstChild);

        // Keep only last 5 changes
        while (changesList.children.length > 5) {
            changesList.removeChild(changesList.lastChild);
        }
    }
});