// Enhanced Swap Feature with Auto-Liquidity
// This replaces the basic swap.js with advanced features
FeatureRegistry.register({
    id: 'swap',
    name: 'Swap',
    icon: '🔄',
    order: 11, // Same order to replace basic swap

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Swap</h3>
            <p class="text-gray-600 mb-6">Swap tokens with auto-liquidity creation</p>
            
            <div class="space-y-4">
                ${UI.createTokenSelect('swapTokenIn', 'From Token')}
                
                <div class="flex justify-center text-gray-400 text-2xl">⇅</div>
                
                ${UI.createTokenSelect('swapTokenOut', 'To Token')}
                
                ${UI.createAmountInput('swapAmount', 'Amount', '1')}

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-sm font-medium text-blue-900">Expected Output</div>
                        <button id="refreshQuote" class="text-xs text-blue-600 hover:text-blue-800">Refresh</button>
                    </div>
                    <div id="expectedOutput" class="text-lg font-bold text-blue-700">-</div>
                    <div id="liquidityStatus" class="text-xs text-blue-600 mt-1"></div>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="autoLiquidity" checked class="w-4 h-4">
                        <span class="text-sm font-medium text-yellow-900">Auto-create liquidity if needed</span>
                    </label>
                    <p class="text-xs text-yellow-700 mt-2">
                        If no liquidity exists, automatically place a limit order to create it
                    </p>
                </div>

                <div id="slippageSettings" class="space-y-2">
                    <label class="block text-sm font-medium">Slippage Tolerance</label>
                    <div class="flex gap-2">
                        <button class="slippage-btn px-3 py-2 rounded-lg text-sm border" data-slippage="0.5">0.5%</button>
                        <button class="slippage-btn px-3 py-2 rounded-lg text-sm border bg-blue-100 border-blue-300" data-slippage="1">1%</button>
                        <button class="slippage-btn px-3 py-2 rounded-lg text-sm border" data-slippage="2">2%</button>
                        <input type="number" id="customSlippage" placeholder="Custom" class="px-3 py-2 rounded-lg text-sm border w-24" step="0.1" min="0" max="50">
                    </div>
                </div>

                ${UI.createButton('Check Quote', () => this.checkQuote(), 'bg-blue-600 hover:bg-blue-700')}
                ${UI.createButton('🔄 Execute Swap', () => this.executeSwap(), 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90')}
            </div>

            <!-- Swap History -->
            <div id="swapHistory" class="hidden mt-6">
                <h4 class="text-lg font-semibold mb-3 text-gray-800">Recent Swaps</h4>
                <div id="swapsList" class="space-y-2"></div>
            </div>
        `;
    },

    slippageTolerance: 1,

    init() {
        // Slippage button handlers
        document.querySelectorAll('.slippage-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.slippage-btn').forEach(b => {
                    b.classList.remove('bg-blue-100', 'border-blue-300');
                });
                btn.classList.add('bg-blue-100', 'border-blue-300');
                this.slippageTolerance = parseFloat(btn.dataset.slippage);
            });
        });

        // Custom slippage
        const customInput = document.getElementById('customSlippage');
        if (customInput) {
            customInput.addEventListener('change', (e) => {
                if (e.target.value) {
                    document.querySelectorAll('.slippage-btn').forEach(b => {
                        b.classList.remove('bg-blue-100', 'border-blue-300');
                    });
                    this.slippageTolerance = parseFloat(e.target.value);
                }
            });
        }

        // Refresh quote button
        const refreshBtn = document.getElementById('refreshQuote');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.checkQuote());
        }
    },

    async checkQuote() {
        const tokenInSymbol = UI.getInputValue('swapTokenIn');
        const tokenOutSymbol = UI.getInputValue('swapTokenOut');
        const amount = UI.getInputValue('swapAmount');

        if (tokenInSymbol === tokenOutSymbol) {
            UI.showStatus('Please select different tokens', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            UI.showStatus('Please enter a valid amount', 'error');
            return;
        }

        UI.showStatus('Fetching quote...', 'info');

        try {
            const tokenIn = CONFIG.TOKENS[tokenInSymbol];
            const tokenOut = CONFIG.TOKENS[tokenOutSymbol];

            const dex = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX,
                STABLECOIN_DEX_ABI,
                TempoApp.provider
            );

            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, TempoApp.provider);
            const tokenOutContract = new ethers.Contract(tokenOut, ERC20_ABI, TempoApp.provider);

            const decimalsIn = await tokenInContract.decimals();
            const decimalsOut = await tokenOutContract.decimals();
            const amountIn = ethers.utils.parseUnits(amount, decimalsIn);

            let expectedOut = ethers.BigNumber.from(0);
            let hasLiquidity = false;

            try {
                expectedOut = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
                if (expectedOut.gt(0)) {
                    hasLiquidity = true;
                    const formatted = ethers.utils.formatUnits(expectedOut, decimalsOut);
                    
                    document.getElementById('expectedOutput').textContent = 
                        `${parseFloat(formatted).toFixed(6)} ${tokenOutSymbol}`;
                    document.getElementById('liquidityStatus').textContent = '✅ Liquidity available';
                    document.getElementById('liquidityStatus').className = 'text-xs text-green-600 mt-1';
                    
                    UI.showStatus('Quote fetched successfully', 'success');
                }
            } catch (error) {
                document.getElementById('expectedOutput').textContent = 'No liquidity';
                document.getElementById('liquidityStatus').textContent = '⚠️ No liquidity pool exists';
                document.getElementById('liquidityStatus').className = 'text-xs text-yellow-600 mt-1';
                UI.showStatus('No liquidity available. Auto-liquidity can help.', 'warning');
            }

        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async executeSwap() {
        const tokenInSymbol = UI.getInputValue('swapTokenIn');
        const tokenOutSymbol = UI.getInputValue('swapTokenOut');
        const amount = UI.getInputValue('swapAmount');
        const autoLiquidity = document.getElementById('autoLiquidity').checked;

        if (tokenInSymbol === tokenOutSymbol) {
            UI.showStatus('Please select different tokens', 'error');
            return;
        }

        UI.showStatus('Initiating swap...', 'info');

        try {
            const tokenIn = CONFIG.TOKENS[tokenInSymbol];
            const tokenOut = CONFIG.TOKENS[tokenOutSymbol];

            const dex = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX,
                STABLECOIN_DEX_ABI,
                TempoApp.signer
            );

            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, TempoApp.signer);
            const tokenOutContract = new ethers.Contract(tokenOut, ERC20_ABI, TempoApp.provider);

            const decimalsIn = await tokenInContract.decimals();
            const decimalsOut = await tokenOutContract.decimals();
            const amountIn = ethers.utils.parseUnits(amount, decimalsIn);

            // Check balance
            const balance = await tokenInContract.balanceOf(TempoApp.account);
            if (balance.lt(amountIn)) {
                UI.showStatus('Insufficient balance', 'error');
                return;
            }

            // Approve
            await TempoApp.approveToken(tokenIn, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountIn);

            // Check liquidity
            let expectedOut = ethers.BigNumber.from(0);
            let hasLiquidity = false;

            try {
                expectedOut = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
                hasLiquidity = expectedOut.gt(0);
            } catch (error) {
                hasLiquidity = false;
            }

            // Auto-create liquidity if needed
            if (!hasLiquidity && autoLiquidity) {
                UI.showStatus('No liquidity found. Creating liquidity...', 'info');
                hasLiquidity = await this.createLiquidity(tokenIn, tokenOut, tokenInSymbol, tokenOutSymbol, amountIn);
            }

            if (!hasLiquidity) {
                UI.showStatus('No liquidity available. Enable auto-liquidity or add liquidity first.', 'error');
                return;
            }

            // Refresh quote after liquidity creation
            try {
                expectedOut = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
            } catch (error) {
                expectedOut = ethers.BigNumber.from(0);
            }

            if (expectedOut.eq(0)) {
                UI.showStatus('Unable to get quote. Swap may fail.', 'error');
                return;
            }

            // Calculate min output with slippage
            const slippagePercent = this.slippageTolerance;
            const minOut = expectedOut.mul(100 - slippagePercent * 10).div(100);

            UI.showStatus('Executing swap...', 'info');
            const tx = await dex.swapExactAmountIn(tokenIn, tokenOut, amountIn, minOut);
            
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            await tx.wait();

            this.addToSwapHistory(tx.hash, tokenInSymbol, tokenOutSymbol, amount, expectedOut, decimalsOut);
            UI.showStatus('Swap completed successfully! 🎉', 'success');

            // Refresh dashboard
            const dashboard = FeatureRegistry.features.find(f => f.id === 'dashboard');
            if (dashboard && dashboard.loadBalances) {
                setTimeout(() => dashboard.loadBalances(), 2000);
            }

        } catch (error) {
            UI.showStatus(`Swap failed: ${error.message}`, 'error');
        }
    },

    async createLiquidity(tokenIn, tokenOut, tokenInSymbol, tokenOutSymbol, amountIn) {
        try {
            const PathUSD = CONFIG.TOKENS.PathUSD;
            const amountOrder = amountIn.mul(2); // Double the amount for liquidity

            const dex = new ethers.Contract(
                CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX,
                STABLECOIN_DEX_ABI,
                TempoApp.signer
            );

            if (tokenIn.toLowerCase() === PathUSD.toLowerCase()) {
                // Selling PathUSD, need to place ASK on tokenOut
                const tokenOutContract = new ethers.Contract(tokenOut, ERC20_ABI, TempoApp.signer);
                const balOut = await tokenOutContract.balanceOf(TempoApp.account);

                if (balOut.gte(amountOrder)) {
                    UI.showStatus(`Placing ASK order for ${tokenOutSymbol} to create liquidity...`, 'info');
                    
                    await TempoApp.approveToken(tokenOut, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountOrder);
                    
                    const placeTx = await dex.place(tokenOut, amountOrder, false, 0, { gasLimit: 3000000 });
                    await placeTx.wait();
                    
                    UI.showStatus('Liquidity order placed! Waiting for settlement...', 'success');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                } else {
                    UI.showStatus(`Insufficient ${tokenOutSymbol} to create liquidity`, 'error');
                    return false;
                }
            } else if (tokenOut.toLowerCase() === PathUSD.toLowerCase()) {
                // Selling other token for PathUSD, need to place BID on tokenIn
                const pathUsdContract = new ethers.Contract(PathUSD, ERC20_ABI, TempoApp.signer);
                const balPath = await pathUsdContract.balanceOf(TempoApp.account);

                if (balPath.gte(amountOrder)) {
                    UI.showStatus(`Placing BID order for ${tokenInSymbol} to create liquidity...`, 'info');
                    
                    await TempoApp.approveToken(PathUSD, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountOrder);
                    
                    const placeTx = await dex.place(tokenIn, amountOrder, true, 0, { gasLimit: 3000000 });
                    await placeTx.wait();
                    
                    UI.showStatus('Liquidity order placed! Waiting for settlement...', 'success');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                } else {
                    UI.showStatus('Insufficient PathUSD to create liquidity', 'error');
                    return false;
                }
            } else {
                // Both non-PathUSD, place ASK on tokenOut
                const tokenOutContract = new ethers.Contract(tokenOut, ERC20_ABI, TempoApp.signer);
                const balOut = await tokenOutContract.balanceOf(TempoApp.account);

                if (balOut.gte(amountOrder)) {
                    await TempoApp.approveToken(tokenOut, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, amountOrder);
                    const placeTx = await dex.place(tokenOut, amountOrder, false, 0, { gasLimit: 3000000 });
                    await placeTx.wait();
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                }
                return false;
            }
        } catch (error) {
            UI.showStatus(`Failed to create liquidity: ${error.message}`, 'error');
            return false;
        }
    },

    addToSwapHistory(txHash, tokenIn, tokenOut, amountIn, amountOut, decimalsOut) {
        const swapHistory = document.getElementById('swapHistory');
        const swapsList = document.getElementById('swapsList');
        
        swapHistory.classList.remove('hidden');

        const formattedOut = ethers.utils.formatUnits(amountOut, decimalsOut);

        const swapDiv = document.createElement('div');
        swapDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-3 fade-in';
        swapDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-green-800">
                        ${amountIn} ${tokenIn} → ${parseFloat(formattedOut).toFixed(6)} ${tokenOut}
                    </div>
                    <div class="text-xs text-green-600">Swap executed successfully</div>
                </div>
                <a href="${CONFIG.EXPLORER_URL}/tx/${txHash}" 
                   target="_blank" 
                   class="text-xs text-blue-600 hover:text-blue-800">
                    View TX →
                </a>
            </div>
        `;
        
        swapsList.insertBefore(swapDiv, swapsList.firstChild);

        // Keep only last 5 swaps
        while (swapsList.children.length > 5) {
            swapsList.removeChild(swapsList.lastChild);
        }
    }
});