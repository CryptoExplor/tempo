// TIP403 Policy Feature
FeatureRegistry.register({
    id: 'policy',
    name: 'Transfer Policy',
    icon: '🔐',
    order: 11,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Transfer Policy (TIP403)</h3>
            <p class="text-gray-600 mb-6">Create and manage transfer policies for your tokens</p>
            
            <div class="space-y-6">
                <!-- Create Policy -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Create Policy</h4>
                    <div class="space-y-4">
                        ${UI.createSelect('policyType', [
                            { value: '0', label: 'Open (No Restrictions)' },
                            { value: '1', label: 'Whitelist Only' },
                            { value: '2', label: 'Blacklist' }
                        ], 'Policy Type')}
                        
                        <div id="accountsInput" class="hidden">
                            <label class="block text-sm font-medium mb-2">Accounts (comma-separated)</label>
                            ${UI.createInput('policyAccounts', '0x123..., 0x456...')}
                        </div>

                        <div class="flex items-center gap-3">
                            <input type="checkbox" id="includeAccounts" class="w-4 h-4">
                            <label for="includeAccounts" class="text-sm">Include initial accounts</label>
                        </div>

                        ${UI.createButton('Create Policy', () => this.createPolicy(), 'bg-purple-600 hover:bg-purple-700')}
                        
                        <div id="policyResult" class="mt-4"></div>
                    </div>
                </div>

                <!-- Modify Policy -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Modify Policy</h4>
                    <div class="space-y-4">
                        ${UI.createInput('modifyPolicyId', 'Policy ID', 'number')}
                        ${UI.createAddressInput('modifyAccount', 'Account Address')}
                        
                        ${UI.createSelect('modifyAction', [
                            { value: 'whitelist_add', label: 'Add to Whitelist' },
                            { value: 'whitelist_remove', label: 'Remove from Whitelist' },
                            { value: 'blacklist_add', label: 'Add to Blacklist' },
                            { value: 'blacklist_remove', label: 'Remove from Blacklist' }
                        ], 'Action')}

                        ${UI.createButton('Modify Policy', () => this.modifyPolicy(), 'bg-blue-600 hover:bg-blue-700')}
                    </div>
                </div>

                <!-- Check Authorization -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Check Authorization</h4>
                    <div class="space-y-4">
                        ${UI.createInput('checkPolicyId', 'Policy ID', 'number')}
                        ${UI.createAddressInput('checkAccount', 'Account Address')}
                        ${UI.createButton('Check', () => this.checkAuthorization(), 'bg-green-600 hover:bg-green-700')}
                        <div id="authResult" class="mt-4"></div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const includeCheckbox = document.getElementById('includeAccounts');
        const accountsDiv = document.getElementById('accountsInput');
        
        if (includeCheckbox && accountsDiv) {
            includeCheckbox.addEventListener('change', (e) => {
                accountsDiv.classList.toggle('hidden', !e.target.checked);
            });
        }
    },

    async createPolicy() {
        const policyType = UI.getInputValue('policyType');
        const includeAccounts = document.getElementById('includeAccounts').checked;
        
        UI.showStatus('Creating policy...', 'info');
        
        try {
            const registry = new ethers.Contract(
                CONFIG.TIP403_REGISTRY,
                TIP403_REGISTRY_ABI,
                TempoApp.signer
            );

            let tx;
            
            if (includeAccounts) {
                const accountsStr = UI.getInputValue('policyAccounts');
                const accounts = accountsStr.split(',').map(a => a.trim()).filter(a => a);
                
                if (accounts.length === 0) {
                    UI.showStatus('Please enter at least one account', 'error');
                    return;
                }

                tx = await registry.createPolicyWithAccounts(TempoApp.account, policyType, accounts);
            } else {
                tx = await registry.createPolicy(TempoApp.account, policyType);
            }

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            const receipt = await tx.wait();

            // Parse PolicyCreated event
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

            const resultDiv = document.getElementById('policyResult');
            if (policyId) {
                resultDiv.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="text-sm text-green-700 font-medium mb-1">Policy Created!</div>
                        <div class="text-2xl font-bold text-green-900">Policy ID: ${policyId}</div>
                    </div>
                `;
                UI.showStatus(`Policy created with ID: ${policyId}`, 'success');
            } else {
                UI.showStatus('Policy created successfully!', 'success');
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async modifyPolicy() {
        const policyId = UI.getInputValue('modifyPolicyId');
        const account = UI.getInputValue('modifyAccount');
        const action = UI.getInputValue('modifyAction');

        if (!policyId || !account || !ethers.utils.isAddress(account)) {
            UI.showStatus('Please fill all fields with valid data', 'error');
            return;
        }

        UI.showStatus('Modifying policy...', 'info');

        try {
            const registry = new ethers.Contract(
                CONFIG.TIP403_REGISTRY,
                TIP403_REGISTRY_ABI,
                TempoApp.signer
            );

            let tx;
            const [listType, actionType] = action.split('_');
            const allowed = actionType === 'add';

            if (listType === 'whitelist') {
                tx = await registry.modifyPolicyWhitelist(policyId, account, allowed);
            } else {
                tx = await registry.modifyPolicyBlacklist(policyId, account, !allowed);
            }

            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('Policy modified successfully!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async checkAuthorization() {
        const policyId = UI.getInputValue('checkPolicyId');
        const account = UI.getInputValue('checkAccount');

        if (!policyId || !account || !ethers.utils.isAddress(account)) {
            UI.showStatus('Please fill all fields with valid data', 'error');
            return;
        }

        UI.showStatus('Checking authorization...', 'info');

        try {
            const registry = new ethers.Contract(
                CONFIG.TIP403_REGISTRY,
                TIP403_REGISTRY_ABI,
                TempoApp.provider
            );

            const isAuthorized = await registry.isAuthorized(policyId, account);

            const resultDiv = document.getElementById('authResult');
            resultDiv.innerHTML = `
                <div class="bg-${isAuthorized ? 'green' : 'red'}-50 border border-${isAuthorized ? 'green' : 'red'}-200 rounded-lg p-4">
                    <div class="text-sm text-${isAuthorized ? 'green' : 'red'}-700 font-medium">
                        ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}
                    </div>
                </div>
            `;
            UI.showStatus('Check complete', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});