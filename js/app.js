// Global App State
const TempoApp = {
    provider: null,
    signer: null,
    account: null,
    features: new Map(),

    init() {
        this.setupEventListeners();
        FeatureRegistry.renderSidebar();
    },

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
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

            // Switch to Tempo network
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xa5bd' }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xa5bd',
                            chainName: 'Tempo Testnet',
                            nativeCurrency: { name: 'TEMPO', symbol: 'TEMPO', decimals: 18 },
                            rpcUrls: [CONFIG.RPC_URL],
                            blockExplorerUrls: [CONFIG.EXPLORER_URL]
                        }]
                    });
                }
            }

            document.getElementById('connectWallet').classList.add('hidden');
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('walletAddress').textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            UI.showStatus('Wallet connected successfully!', 'success');
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