// Global App State
const TempoApp = {
    provider: null,
    signer: null,
    account: null,
    features: new Map(),

    init() {
        this.setupEventListeners();
        FeatureRegistry.renderSidebar();
        this.showNetworkInfo();
    },

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
    },

    showNetworkInfo() {
        // Show migration notice if on old testnet
        const networkBanner = document.createElement('div');
        networkBanner.id = 'networkBanner';
        networkBanner.className = 'bg-blue-600 text-white py-3 px-4 text-center text-sm';
        networkBanner.innerHTML = `
            <div class="max-w-7xl mx-auto flex items-center justify-center gap-2">
                <span>🚀</span>
                <span><strong>Moderato Testnet</strong> (Chain ID: ${CONFIG.CHAIN_ID}) • Launched ${CONFIG.LAUNCH_DATE}</span>
                <span>•</span>
                <a href="https://github.com/CryptoExplor/tempo#network-upgrades" target="_blank" class="underline hover:text-blue-200">Migration Guide</a>
            </div>
        `;
        document.body.insertBefore(networkBanner, document.body.firstChild);
    },

    async connectWallet() {
        try {
            if (!window.ethereum) {
                UI.showStatus('Please install MetaMask!', 'error');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = accounts[0];

            // Check if user is on the correct network
            const network = await this.provider.getNetwork();
            
            if (network.chainId !== CONFIG.CHAIN_ID) {
                UI.showStatus('Switching to Moderato testnet...', 'info');
                
                // Try to switch to Moderato
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: CONFIG.CHAIN_ID_HEX }],
                    });
                } catch (switchError) {
                    // If network doesn't exist, add it automatically
                    if (switchError.code === 4902 || switchError.code === -32603) {
                        UI.showStatus('Adding Moderato testnet to your wallet...', 'info');
                        
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: CONFIG.CHAIN_ID_HEX,
                                    chainName: CONFIG.NETWORK_NAME,
                                    nativeCurrency: { 
                                        name: 'USD', 
                                        symbol: 'USD', 
                                        decimals: 18 
                                    },
                                    rpcUrls: [CONFIG.RPC_URL],
                                    blockExplorerUrls: [CONFIG.EXPLORER_URL]
                                }]
                            });
                            UI.showStatus('Moderato testnet added successfully!', 'success');
                        } catch (addError) {
                            UI.showStatus('Failed to add network. Please add it manually.', 'error');
                            throw addError;
                        }
                    } else {
                        throw switchError;
                    }
                }
                
                // Refresh provider after network switch
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
            }

            // Check if user might be on legacy Andantino
            if (network.chainId === CONFIG.LEGACY.CHAIN_ID) {
                UI.showStatus('⚠️ You are on the deprecated Andantino testnet. Please switch to Moderato!', 'error');
                
                const migrationNotice = document.createElement('div');
                migrationNotice.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 shadow-2xl z-50 max-w-2xl';
                migrationNotice.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="text-4xl">⚠️</div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-yellow-900 mb-2">Network Migration Required</h3>
                            <p class="text-yellow-800 mb-3">
                                You're connected to <strong>Andantino</strong> (deprecated March 8, 2025).
                                Please switch to the new <strong>Moderato testnet</strong>.
                            </p>
                            <button id="switchToModerato" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold">
                                Switch to Moderato
                            </button>
                            <button id="dismissMigration" class="ml-2 text-yellow-700 hover:text-yellow-900 px-4 py-2">
                                Dismiss
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(migrationNotice);

                document.getElementById('switchToModerato').onclick = async () => {
                    migrationNotice.remove();
                    await this.connectWallet();
                };
                
                document.getElementById('dismissMigration').onclick = () => {
                    migrationNotice.remove();
                };

                return;
            }

            document.getElementById('connectWallet').classList.add('hidden');
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('walletAddress').textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            UI.showStatus('Wallet connected to Moderato testnet!', 'success');
            FeatureRegistry.showFeature('dashboard');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async getTokenBalance(tokenAddress) {
        try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            const balance = await contract.balanceOf(this.account);
            const decimals = await contract.decimals();
            const formatted = ethers.utils.formatUnits(balance, decimals);
            return { balance, decimals, formatted };
        } catch (error) {
            return { balance: ethers.BigNumber.from(0), decimals: 18, formatted: '0' };
        }
    },

    async approveToken(tokenAddress, spenderAddress, amount) {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const allowance = await contract.allowance(this.account, spenderAddress);
        
        if (allowance.lt(amount)) {
            UI.showStatus('Approving token...', 'info');
            const tx = await contract.approve(spenderAddress, ethers.constants.MaxUint256);
            await tx.wait();
            UI.showStatus('Token approved!', 'success');
        }
    }
};

// Feature Registry System
const FeatureRegistry = {
    features: [],

    register(feature) {
        this.features.push(feature);
        this.features.sort((a, b) => a.order - b.order);
    },

    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = '';

        this.features.forEach(feature => {
            const btn = document.createElement('button');
            btn.onclick = () => this.showFeature(feature.id);
            btn.setAttribute('data-tab', feature.id);
            btn.className = 'tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-100';
            btn.innerHTML = `<span>${feature.icon}</span><span class="font-medium">${feature.name}</span>`;
            sidebar.appendChild(btn);
        });
    },

    showFeature(featureId) {
        const feature = this.features.find(f => f.id === featureId);
        if (!feature) return;

        // Update sidebar buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.className = 'tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-100';
        });

        const activeBtn = document.querySelector(`[data-tab="${featureId}"]`);
        if (activeBtn) {
            activeBtn.className = 'tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md';
        }

        // Render feature content
        const content = document.getElementById('featureContent');
        content.innerHTML = feature.render();
        content.classList.add('fade-in');

        // Initialize feature if it has an init method
        if (feature.init) {
            setTimeout(() => feature.init(), 100);
        }
    }
};

