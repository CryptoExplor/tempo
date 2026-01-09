# Tempo Testnet Console

> **🚀 Updated for Moderato Testnet (January 8, 2025)**

A comprehensive testnet-only console for manual onchain actions on Tempo blockchain: faucets, swaps, NFTs, batch transfers, liquidity management, and more.

[![Tempo](https://img.shields.io/badge/Network-Moderato%20Testnet-blue)](https://explore.tempo.xyz)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-42431-purple)](https://explore.tempo.xyz)
[![Version](https://img.shields.io/badge/Version-v1.0.0--rc.1-green)](https://github.com/CryptoExplor/tempo)

## 🌐 Network Information

**This console now uses the Moderato testnet.**

| Setting | Value |
|---------|-------|
| Network Name | Tempo Moderato Testnet |
| RPC URL | `https://rpc.moderato.tempo.xyz` |
| Chain ID | `42431` (hex: `0xa5bf`) |
| Explorer | [explore.tempo.xyz](https://explore.tempo.xyz) |
| Native Token | TEMPO |
| Version | v1.0.0-rc.1 |
| Launched | January 8, 2025 |

## ⚠️ Network Migration Notice

### Andantino → Moderato Migration

On **January 8, 2025**, Tempo launched the **Moderato testnet** to replace Andantino (which will be deprecated on **March 8, 2025**).

#### Why the Migration?

- **Faster feature releases**: Ship improvements more quickly
- **Better mainnet alignment**: Moderato closely mirrors mainnet release candidate
- **Improved reliability**: Updated infrastructure provides better stability

#### Migration Steps

1. **Update Chain Configuration** - This console is already configured for Moderato
2. **Redeploy Contracts** - Any contracts from Andantino must be redeployed
3. **Reset Databases** - Clear any local data from Andantino
4. **Get New Testnet Tokens** - Use the faucet feature in this console

**Old Andantino Network** (deprecated March 8, 2025):
- RPC: `https://rpc.testnet.tempo.xyz`
- Chain ID: `42429` (hex: `0xa5bd`)

## ✨ Features

### 💰 Token Management
- **Faucet** - Get free testnet tokens
- **Send** - Transfer tokens with optional memo messages
- **Batch Transfer** - Send to multiple addresses at once
- **Create Token** - Deploy your own TIP-20 tokens
- **Mint/Burn Tokens** - Manage token supply
- **Grant Roles** - Assign ISSUER and PAUSE roles

### 🔄 Trading & Swaps
- **Swap** - Exchange tokens with auto-liquidity creation
- **Limit Orders** - Place bid/ask orders on the DEX
- **Liquidity** - Add/remove liquidity from pools

### 🎨 NFTs & Collectibles
- **Retriever NFT** - Claim Tempo's official testnet NFTs
- **OnChain GM** - Send onchain GM messages
- **Deploy Contracts** - Deploy custom smart contracts

### 🔐 Advanced Features
- **TIP-403 Policies** - Create transfer policies (whitelist/blacklist)
- **Domain Names** - Register .tempo domain names
- **Statistics** - View detailed wallet and network analytics

## 🚀 Quick Start

1. **Connect Wallet**
   - Install [MetaMask](https://metamask.io)
   - Visit the console
   - Click "Connect Wallet"
   - The console will automatically configure Moderato testnet

2. **Get Testnet Tokens**
   - Navigate to "Faucet" in the sidebar
   - Click "Claim Tokens"
   - Wait for confirmation

3. **Start Testing**
   - Explore features in the sidebar
   - All actions are on the Moderato testnet
   - No real funds at risk!

## 📦 Installation & Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/CryptoExplor/tempo.git
cd tempo

# Install dependencies (optional, for local server)
npm install

# Start local development server
npm run dev

# Open browser to http://localhost:3000
```

### Deployment

This is a static web application that can be deployed to any static hosting service:

```bash
# Deploy to Vercel
npm run deploy

# Or manually upload to:
# - GitHub Pages
# - Netlify
# - Vercel
# - Any static host
```

## 🛠️ Technical Details

### Smart Contract Addresses (Moderato)

```javascript
// System Tokens
PathUSD:   0x20c0000000000000000000000000000000000000
AlphaUSD:  0x20c0000000000000000000000000000000000001
BetaUSD:   0x20c0000000000000000000000000000000000002
ThetaUSD:  0x20c0000000000000000000000000000000000003

// System Contracts
TIP20_FACTORY:   0x20fc000000000000000000000000000000000000
FEE_MANAGER:     0xfeec000000000000000000000000000000000000
STABLECOIN_DEX:  0xdec0000000000000000000000000000000000000
TIP403_REGISTRY: 0x403c000000000000000000000000000000000000
```

### Technology Stack

- **Frontend**: Vanilla JavaScript, TailwindCSS
- **Web3**: Ethers.js v5.7.2
- **Network**: Tempo Moderato Testnet
- **Wallet**: MetaMask integration

### Browser Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- MetaMask or compatible Web3 wallet
- JavaScript enabled

## 📖 Usage Examples

### Creating a Token

```javascript
// Navigate to "Create Token"
// Enter name: "My Test Token"
// Enter symbol: "MTT"
// Click "Create Token"
// Token will be deployed and address shown
```

### Swapping Tokens

```javascript
// Navigate to "Swap"
// Select from token: PathUSD
// Select to token: AlphaUSD
// Enter amount
// Click "Execute Swap"
// Approve and confirm transaction
```

### Adding Liquidity

```javascript
// Navigate to "Liquidity"
// Select "Add Liquidity" mode
// Choose token pair
// Enter amount
// Click "Add Liquidity"
```

## 🔗 Important Links

- **Explorer**: [explore.tempo.xyz](https://explore.tempo.xyz)
- **Documentation**: [Tempo Docs](https://docs.tempo.xyz)
- **GitHub**: [github.com/CryptoExplor/tempo](https://github.com/CryptoExplor/tempo)
- **Support**: [partners@tempo.xyz](mailto:partners@tempo.xyz)

## 💝 Support the Project

If you find this console useful, consider supporting the development:

**Tip Address**: `0x4f6Fb0A6c8A4C667bdF73C0257BE162B144c1624`

**Farcaster**: [dare1.eth](https://farcaster.xyz/dare1.eth)

## 📄 License

MIT License - feel free to use, modify, and distribute.

## ⚡ Key Features Highlight

### 🎲 Random Memo Generator
Send tokens with creative, randomly-generated memos:
- "Payment #1234"
- "Thanks! 🎉"
- "Invoice #5678"
- And more!

### 🔄 Unified Liquidity Management
Single interface for both adding and removing liquidity with visual mode switching.

### 📊 Comprehensive Statistics
Track all your testnet activity:
- Transaction history
- Token holdings
- Gas analytics
- Top wallets

### 🚀 Auto-Liquidity Creation
Swap feature automatically creates liquidity pools if they don't exist!

## 🐛 Troubleshooting

### "Wrong Network" Error
- Make sure you're connected to Moderato (Chain ID: 42431)
- Click "Switch to Moderato" if prompted
- Clear MetaMask cache if issues persist

### Transaction Failures
- Ensure you have enough TEMPO for gas
- Use the faucet to get testnet tokens
- Check transaction on [explorer](https://explore.tempo.xyz)

### Contract Addresses Not Working
- Contracts may need to be redeployed on Moderato
- Check [explorer](https://explore.tempo.xyz) for verification
- Contact [partners@tempo.xyz](mailto:partners@tempo.xyz) for support

## 📞 Need Help?

For assistance with:
- Migration from Andantino
- Contract redeployment
- Infrastructure coordination
- Technical support

**Contact**: [partners@tempo.xyz](mailto:partners@tempo.xyz)

---

**Built for Tempo Testnet **

© 2025 Tempo Testnet Console
