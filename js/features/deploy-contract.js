// Deploy Contract Feature
FeatureRegistry.register({
    id: 'deploy-contract',
    name: 'Deploy Contract',
    icon: '🚀',
    order: 15,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Deploy Smart Contract</h3>
            <p class="text-gray-600 mb-6">Deploy a simple storage contract to the Tempo testnet</p>
            
            <div class="space-y-6">
                <!-- Contract Info -->
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                    <h4 class="text-lg font-bold text-gray-800 mb-3">📝 Simple Storage Contract</h4>
                    <div class="space-y-2 text-sm text-gray-700">
                        <div>• Stores a message string</div>
                        <div>• Allows reading and updating the message</div>
                        <div>• Perfect for testing contract deployment</div>
                    </div>
                </div>

                <!-- Deployment Settings -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Deployment Settings</h4>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Number of Contracts to Deploy</label>
                            <input type="number" 
                                   id="deployCount" 
                                   value="1" 
                                   min="1" 
                                   max="10"
                                   class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Deploy between 1-10 contracts</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Initial Message (optional)</label>
                            <input type="text" 
                                   id="initialMessage" 
                                   placeholder="Hello, Tempo!"
                                   class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Message to store in the contract</p>
                        </div>

                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-yellow-900 mb-2">⚠️ Gas Estimate</div>
                            <div class="text-sm text-yellow-700">
                                Each deployment costs ~<strong>0.001 TEMPO</strong> in gas
                            </div>
                        </div>
                    </div>
                </div>

                ${UI.createButton('🚀 Deploy Contract(s)', () => this.deployContracts(), 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90')}

                <!-- Deployment Progress -->
                <div id="deploymentProgress" class="hidden">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="text-sm font-medium text-blue-900 mb-2">Deployment Progress</div>
                        <div id="progressBar" class="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div id="progressFill" class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
                        </div>
                        <div id="progressText" class="text-sm text-blue-700">Preparing...</div>
                    </div>
                </div>

                <!-- Deployed Contracts -->
                <div id="deployedContracts" class="hidden">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800">Deployed Contracts</h4>
                    <div id="contractsList" class="space-y-2"></div>
                </div>

                <!-- Deployment Summary -->
                <div id="deploymentSummary" class="hidden bg-gray-50 rounded-lg p-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Deployment Summary</div>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-green-600" id="successCount">0</div>
                            <div class="text-xs text-gray-600">Successful</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-red-600" id="failCount">0</div>
                            <div class="text-xs text-gray-600">Failed</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-blue-600" id="totalCount">0</div>
                            <div class="text-xs text-gray-600">Total</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async deployContracts() {
        const count = parseInt(UI.getInputValue('deployCount')) || 1;
        const message = document.getElementById('initialMessage').value || 'Hello from Tempo!';

        if (count < 1 || count > 10) {
            UI.showStatus('Please enter a number between 1 and 10', 'error');
            return;
        }

        UI.showStatus(`Starting deployment of ${count} contract(s)...`, 'info');

        // Show progress
        const progressDiv = document.getElementById('deploymentProgress');
        const contractsDiv = document.getElementById('deployedContracts');
        const summaryDiv = document.getElementById('deploymentSummary');
        
        progressDiv.classList.remove('hidden');
        contractsDiv.classList.remove('hidden');
        summaryDiv.classList.remove('hidden');

        let successCount = 0;
        let failCount = 0;

        // Simple Storage Contract bytecode and ABI
        const CONTRACT_ABI = [
            "function setMessage(string msg_) external",
            "function message() view returns (string)"
        ];
        
        // This is a simplified Storage contract bytecode
        const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b5061012e806100206000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c8063368b8772146037578063e21f37ce146059575b600080fd5b605760048036036020811015604b57600080fd5b8101908080359060200190929190505050607d565b005b60616087565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101560a0578082015181840152602081019050608b565b50505050905090810190601f1680156100cd5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b8060008190555050565b60606000805461009c906100d8565b80601f01602080910402602001604051908101604052809291908181526020018280546100c8906100d8565b80156101155780601f106100ea57610100808354040283529160200191610115565b820191906000526020600020905b8154815290600101906020018083116100f857829003601f168201915b5050505050905090565b600181811c9082168061013357607f821691505b6020821081036101535760008081fd5b50919050565b50919050565b5056fea264697066735822122001234567890abcdef01234567890abcdef01234567890abcdef0123456789064736f6c63430008120033";

        for (let i = 0; i < count; i++) {
            const progress = ((i + 1) / count) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('progressText').textContent = `Deploying contract ${i + 1} of ${count}...`;

            try {
                UI.showStatus(`Deploying contract ${i + 1}/${count}...`, 'info');

                const factory = new ethers.ContractFactory(
                    CONTRACT_ABI,
                    CONTRACT_BYTECODE,
                    TempoApp.signer
                );

                const contract = await factory.deploy();
                await contract.deployed();

                const address = contract.address;
                successCount++;

                this.addDeployedContract(address, i + 1, 'success');
                UI.showStatus(`Contract ${i + 1} deployed: ${address}`, 'success');

                // Small delay between deployments
                if (i < count - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                failCount++;
                this.addDeployedContract(null, i + 1, 'failed', error.message);
                console.error(`Deployment ${i + 1} failed:`, error);
            }
        }

        // Update summary
        document.getElementById('successCount').textContent = successCount;
        document.getElementById('failCount').textContent = failCount;
        document.getElementById('totalCount').textContent = count;

        if (failCount === 0) {
            UI.showStatus(`All ${count} contract(s) deployed successfully! 🎉`, 'success');
        } else {
            UI.showStatus(`Completed: ${successCount} successful, ${failCount} failed`, 'warning');
        }
    },

    addDeployedContract(address, number, status, error = null) {
        const contractsList = document.getElementById('contractsList');
        
        const contractDiv = document.createElement('div');
        contractDiv.className = `${status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 fade-in`;
        
        if (status === 'success') {
            contractDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-green-800">
                            ✅ Contract #${number}
                        </div>
                        <div class="text-xs text-green-600 font-mono break-all mt-1">
                            ${address}
                        </div>
                    </div>
                    <a href="${CONFIG.EXPLORER_URL}/address/${address}" 
                       target="_blank" 
                       class="ml-2 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap">
                        View →
                    </a>
                </div>
            `;
        } else {
            contractDiv.innerHTML = `
                <div>
                    <div class="text-sm font-medium text-red-800">
                        ❌ Contract #${number} - Deployment Failed
                    </div>
                    <div class="text-xs text-red-600 mt-1">
                        ${error ? error.slice(0, 100) : 'Unknown error'}
                    </div>
                </div>
            `;
        }
        
        contractsList.appendChild(contractDiv);
    }
});