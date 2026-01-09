// ======================
// NFT FEATURE
// ======================
FeatureRegistry.register({
    id: 'nft',
    name: 'NFT',
    icon: '🖼️',
    order: 17,

    render() {
        return `
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Mint NFT</h3>
            <p class="text-gray-600 mb-4">Mint Retriever NFT on Tempo</p>
            ${UI.createButton('🖼️ Mint NFT', () => this.mintNFT(), 'bg-pink-600 hover:bg-pink-700')}
        `;
    },

    async mintNFT() {
        UI.showStatus('Minting NFT...', 'info');
        try {
            const nft = new ethers.Contract(CONFIG.RETRIEVER_NFT_CONTRACT, RETRIEVER_NFT_ABI, TempoApp.signer);

            const allowlistProof = {
                proof: [],
                quantityLimitPerWallet: ethers.constants.MaxUint256,
                pricePerToken: 0,
                currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            };

            const tx = await nft.claim(
                TempoApp.account,
                1,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                0,
                allowlistProof,
                "0x"
            );
            UI.showStatus(`TX: ${tx.hash}`, 'info');
            await tx.wait();
            UI.showStatus('NFT minted successfully!', 'success');
        } catch (error) {
            UI.showStatus(`Error: ${error.message}`, 'error');
        }
    }
});