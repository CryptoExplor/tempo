// OnChainGM Feature
FeatureRegistry.register({
    id: 'onchaingm',
    name: 'OnChain GM',
    icon: '👋',
    order: 19,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">OnChain GM</h3>
            <p class="text-gray-600 mb-6">Send onchain GM messages and deploy GM contracts</p>
            
            <div class="space-y-6">
                <!-- Send GM -->
                <div class="border-b pb-6">
                    <h4 class="text-lg font-semibold mb-4">Send GM Message</h4>
                    <div class="space-y-4">
                        ${UI.createAddressInput('gmReceiver', 'Receiver Address')}
                        ${UI.createButton('Send GM', () => this.sendGM(), 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90')}
                    </div>
                </div>

                <!-- Deploy GM Contract -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Deploy GM Contract</h4>
                    <p class="text-sm text-gray-600 mb-4">Deploy your own OnChainGM contract</p>
                    <div id="deployedContract" class="mb-4"></div>
                    ${UI.createButton('Deploy Contract', () => this.deployGM(), 'bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90')}
                </div>
            </div>
        `;
    },

    async sendGM() {
        const receiver = UI.getInputValue('gmReceiver');
        
        if (!receiver || !ethers.utils.isAddress(receiver)) {
            UI.showStatus('Please enter a valid receiver address', 'error');
            return;
        }

        UI.showStatus('Sending GM...', 'info');
        
        try {
            const pathUsdAddress = CONFIG.TOKENS.PathUSD;
            const feeAmount = CONFIG.ONCHAINGM_FEE;

            // Approve PathUSD
            await TempoApp.approveToken(
                pathUsdAddress, 
                CONFIG.ONCHAINGM_CONTRACT, 
                ethers.BigNumber.from(feeAmount)
            );

            // Send GM
            const gmContract = new ethers.Contract(
                CONFIG.ONCHAINGM_CONTRACT,
                ONCHAINGM_ABI,
                TempoApp.signer
            );

            UI.showStatus('Sending GM message...', 'info');
            const tx = await gmContract.onChainGM(receiver);
            UI.showStatus(`Transaction sent: ${tx.hash}`, 'info');
            
            await tx.wait();
            UI.showStatus(`GM sent successfully to ${receiver}!`, 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    },

    async deployGM() {
        UI.showStatus('Deploying GM contract...', 'info');
        
        try {
            const pathUsdAddress = CONFIG.TOKENS.PathUSD;
            const deployFee = CONFIG.ONCHAINGM_DEPLOY_FEE;

            // Approve PathUSD for deploy fee
            await TempoApp.approveToken(
                pathUsdAddress,
                CONFIG.ONCHAINGM_DEPLOY_CONTRACT,
                ethers.BigNumber.from(deployFee)
            );

            // Deploy contract
            const deployContract = new ethers.Contract(
                CONFIG.ONCHAINGM_DEPLOY_CONTRACT,
                ONCHAINGM_DEPLOY_ABI,
                TempoApp.signer
            );

            UI.showStatus('Deploying contract...', 'info');
            const tx = await deployContract.deploy();
            UI.showStatus(`Deploy transaction: ${tx.hash}`, 'info');
            
            const receipt = await tx.wait();
            
            // Try to get deployed address from logs
            let deployedAddress = null;
            for (const log of receipt.logs) {
                if (log.topics.length > 0) {
                    try {
                        deployedAddress = ethers.utils.getAddress('0x' + log.topics[1].slice(26));
                        break;
                    } catch (e) { continue; }
                }
            }

            const deployedDiv = document.getElementById('deployedContract');
            if (deployedAddress) {
                deployedDiv.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="text-sm text-green-700 font-medium mb-1">Contract Deployed!</div>
                        <div class="font-mono text-xs break-all text-green-900">${deployedAddress}</div>
                    </div>
                `;
                UI.showStatus(`GM Contract deployed at: ${deployedAddress}`, 'success');
            } else {
                UI.showStatus('Contract deployed successfully!', 'success');
            }
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});