// Grant Role Feature
FeatureRegistry.register({
    id: 'grant-role',
    name: 'Grant Role',
    icon: '🔑',
    order: 10,
    userTokens: [],

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Grant Token Roles</h3>
            <p class="text-gray-600 mb-6">Grant ISSUER or PAUSE roles to addresses on your created tokens</p>
            
            <div class="space-y-6">
                <!-- Scan for Created Tokens -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Your Created Tokens</h4>
                    <div id="userTokensList" class="mb-4 space-y-2">
                        <div class="text-sm text-gray-500">Click "Load My Tokens" to scan for tokens you've created</div>
                    </div>
                    ${UI.createButton('Load My Tokens', () => this.loadUserTokens(), 'bg-blue-600 hover:bg-blue-700')}
                </div>

                <!-- Grant Role -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Grant Role</h4>
                    <div class="space-y-4">
                        <div id="tokenSelectContainer">
                            <p class="text-sm text-gray-500">Load your tokens first</p>
                        </div>

                        ${UI.createSelect('grantRoleType', [
                            { value: 'ISSUER_ROLE', label: 'ISSUER_ROLE (Mint tokens)' },
                            { value: 'PAUSE_ROLE', label: 'PAUSE_ROLE (Pause transfers)' }
                        ], 'Role Type')}

                        ${UI.createAddressInput('grantRoleAddress', 'Address to Grant Role')}

                        ${UI.createButton('Grant Role', () => this.grantRole(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
                    </div>
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

            // Get TokenCreated events for this user
            const filter = factory.filters.TokenCreated(null, null, null, null, null, TempoApp.account);
            const events = await factory.queryFilter(filter);

            this.userTokens = [];
            const tokensList = document.getElementById('userTokensList');
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

            // Update token select dropdown
            const tokenSelectContainer = document.getElementById('tokenSelectContainer');
            const options = this.userTokens.map(token => ({
                value: token.address,
                label: token.symbol
            }));
            
            tokenSelectContainer.innerHTML = UI.createSelect('grantTokenAddress', options, 'Select Token');

            UI.showStatus(`Found ${this.userTokens.length} token(s)`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async grantRole() {
        if (this.userTokens.length === 0) {
            UI.showStatus('Please load your tokens first', 'error');
            return;
        }

        const tokenAddress = UI.getInputValue('grantTokenAddress');
        const roleType = UI.getInputValue('grantRoleType');
        const address = UI.getInputValue('grantRoleAddress');

        if (!address || !ethers.utils.isAddress(address)) {
            UI.showStatus('Please enter a valid address', 'error');
            return;
        }

        UI.showStatus(`Granting ${roleType}...`, 'info');

        try {
            const TIP20_EXTENDED_ABI = [
                "function hasRole(bytes32 role, address account) view returns (bool)",
                "function grantRole(bytes32 role, address account)"
            ];

            const tokenContract = new ethers.Contract(
                tokenAddress,
                TIP20_EXTENDED_ABI,
                TempoApp.signer
            );

            const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(roleType));
            
            // Check if role already granted
            const hasRole = await tokenContract.hasRole(roleHash, address);
            
            if (hasRole) {
                UI.showStatus(`${roleType} already granted to this address`, 'warning');
                return;
            }

            UI.showStatus('Granting role...', 'info');
            const tx = await tokenContract.grantRole(roleHash, address, { gasLimit: 200000 });
            
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();
            
            UI.showStatus(`${roleType} granted successfully!`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});