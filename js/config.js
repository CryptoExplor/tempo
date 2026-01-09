// Configuration - Updated for Moderato Testnet (Jan 8, 2025)
const CONFIG = {
    // ===== MODERATO TESTNET (NEW) =====
    RPC_URL: 'https://rpc.moderato.tempo.xyz',
    CHAIN_ID: 42431,
    CHAIN_ID_HEX: '0xa5bf',
    EXPLORER_URL: 'https://explore.tempo.xyz',
    
    // System Token Addresses (verify these on Moderato)
    TOKENS: {
        'PathUSD': '0x20c0000000000000000000000000000000000000',
        'AlphaUSD': '0x20c0000000000000000000000000000000000001',
        'BetaUSD': '0x20c0000000000000000000000000000000000002',
        'ThetaUSD': '0x20c0000000000000000000000000000000000003'
    },
    
    // System Contracts (verify these on Moderato)
    SYSTEM_CONTRACTS: {
        TIP20_FACTORY: '0x20fc000000000000000000000000000000000000',
        FEE_MANAGER: '0xfeec000000000000000000000000000000000000',
        STABLECOIN_DEX: '0xdec0000000000000000000000000000000000000'
    },
    
    // Other Contracts (these will need to be verified/redeployed on Moderato)
    INFINITY_NAME_CONTRACT: '0x70a57af45cd15f1565808cf7b1070bac363afd8a',
    RETRIEVER_NFT_CONTRACT: '0x603928C91Db2A58E2E689D42686A139Ad41CB51C',
    ONCHAINGM_CONTRACT: '0x2d91014C9Ab33821C4Fa15806c63D2C053cdD10c',
    ONCHAINGM_DEPLOY_CONTRACT: '0xa89E3e260C85d19c0b940245FDdb1e845C93dED8',
    ONCHAINGM_FEE: '15000000',
    ONCHAINGM_DEPLOY_FEE: '20000000',
    TIP403_REGISTRY: '0x403c000000000000000000000000000000000000',
    
    // Network Info
    NETWORK_NAME: 'Tempo Moderato Testnet',
    NETWORK_VERSION: 'v1.0.0-rc.1',
    LAUNCH_DATE: 'January 8, 2025',
    DEPRECATION_DATE: 'N/A (Current testnet)',
    
    // Legacy Andantino (deprecated March 8, 2025)
    LEGACY: {
        RPC_URL: 'https://rpc.testnet.tempo.xyz',
        CHAIN_ID: 42429,
        CHAIN_ID_HEX: '0xa5bd',
        DEPRECATION_DATE: 'March 8, 2025',
        WARNING: 'Andantino testnet is deprecated. Please use Moderato.'
    }
};

// ABIs (unchanged)
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const TIP20_FACTORY_ABI = [
    "function createToken(string name, string symbol, string currency, address quoteToken, address admin) returns (address)",
    "event TokenCreated(address indexed token, uint256 indexed tokenId, string name, string symbol, string currency, address quoteToken, address admin)"
];

const STABLECOIN_DEX_ABI = [
    "function swapExactAmountIn(address tokenIn, address tokenOut, uint128 amountIn, uint128 minAmountOut) returns (uint128 amountOut)",
    "function quoteSwapExactAmountIn(address tokenIn, address tokenOut, uint128 amountIn) view returns (uint128 amountOut)",
    "function place(address token, uint128 amount, bool isBid, int16 tick) returns (uint128 orderId)"
];

const FEE_MANAGER_ABI = [
    "function mintWithValidatorToken(address userToken, address validatorToken, uint256 amountValidatorToken, address to) returns (uint256 liquidity)"
];

const INFINITY_NAME_ABI = [
    "function register(string domain, address referrer) returns (uint256)",
    "function isAvailable(string domain) view returns (bool)",
    "function price() view returns (uint256)"
];

const RETRIEVER_NFT_ABI = [
    "function claim(address receiver, uint256 quantity, address currency, uint256 pricePerToken, tuple(bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) allowlistProof, bytes data)",
    "function balanceOf(address owner) view returns (uint256)"
];

const ONCHAINGM_ABI = [
    "function onChainGM(address receiver)"
];

const ONCHAINGM_DEPLOY_ABI = [
    "function deploy() returns (address)"
];

const TIP403_REGISTRY_ABI = [
    "function createPolicy(address admin, uint8 policyType) returns (uint64)",
    "function createPolicyWithAccounts(address admin, uint8 policyType, address[] accounts) returns (uint64)",
    "function modifyPolicyWhitelist(uint64 policyId, address account, bool allowed)",
    "function modifyPolicyBlacklist(uint64 policyId, address account, bool restricted)",
    "function isAuthorized(uint64 policyId, address user) view returns (bool)",
    "event PolicyCreated(uint64 indexed policyId, address indexed admin, uint8 policyType)"
];

const TIP20_POLICY_ABI = [
    "function transferPolicyId() view returns (uint64)",
    "function changeTransferPolicyId(uint64 newPolicyId)"
];
