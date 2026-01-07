import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Coins, ArrowRightLeft, Droplets, Settings, Zap, Flame, MessageSquare, TrendingUp, Minus, Shield, Image, Globe, Package, BarChart3, Activity, Play, Send } from 'lucide-react';

// Configuration
const CONFIG = {
  RPC_URL: 'https://rpc.testnet.tempo.xyz',
  CHAIN_ID: 42429,
  EXPLORER_URL: 'https://explore.tempo.xyz',
  TOKENS: {
    'PathUSD': '0x20c0000000000000000000000000000000000000',
    'AlphaUSD': '0x20c0000000000000000000000000000000000001',
    'BetaUSD': '0x20c0000000000000000000000000000000000002',
    'ThetaUSD': '0x20c0000000000000000000000000000000000003'
  },
  SYSTEM_CONTRACTS: {
    TIP20_FACTORY: '0x20fc000000000000000000000000000000000000',
    FEE_MANAGER: '0xfeec000000000000000000000000000000000000',
    STABLECOIN_DEX: '0xdec0000000000000000000000000000000000000'
  },
  INFINITY_NAME_CONTRACT: '0x70a57af45cd15f1565808cf7b1070bac363afd8a',
  RETRIEVER_NFT_CONTRACT: '0x603928C91Db2A58E2E689D42686A139Ad41CB51C',
  ONCHAINGM_CONTRACT: '0x2d91014C9Ab33821C4Fa15806c63D2C053cdD10c',
  ONCHAINGM_DEPLOY_CONTRACT: '0xa89E3e260C85d19c0b940245FDdb1e845C93dED8'
};

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
  "function setUserToken(address token)",
  "function mintWithValidatorToken(address userToken, address validatorToken, uint256 amountValidatorToken, address to) returns (uint256 liquidity)",
  "function burn(address userToken, address validatorToken, uint256 liquidity, address to) returns (uint256 amountUserToken, uint256 amountValidatorToken)"
];

const INFINITY_NAME_ABI = [
  "function register(string domain, address referrer) returns (uint256)",
  "function isAvailable(string domain) view returns (bool)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [balances, setBalances] = useState({});
  const [tokenData, setTokenData] = useState([]);

  useEffect(() => {
    if (account && provider) {
      loadBalances();
    }
  }, [account, provider]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      // Switch to Tempo network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa5bd' }], // 42429 in hex
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

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setStatus('Wallet connected successfully!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const loadBalances = async () => {
    const newBalances = {};
    for (const [symbol, address] of Object.entries(CONFIG.TOKENS)) {
      try {
        const contract = new ethers.Contract(address, ERC20_ABI, provider);
        const balance = await contract.balanceOf(account);
        const decimals = await contract.decimals();
        newBalances[symbol] = ethers.formatUnits(balance, decimals);
      } catch (error) {
        newBalances[symbol] = '0';
      }
    }
    setBalances(newBalances);
  };

  const claimFaucet = async () => {
    setLoading(true);
    setStatus('Claiming from faucet...');
    try {
      const txHashes = await provider.send('tempo_fundAddress', [account]);
      setStatus(`Faucet claimed! TX: ${Array.isArray(txHashes) ? txHashes[0] : txHashes}`);
      setTimeout(loadBalances, 3000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const sendToken = async (tokenSymbol, recipient, amount) => {
    setLoading(true);
    try {
      const tokenAddress = CONFIG.TOKENS[tokenSymbol];
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const tx = await contract.transfer(recipient, amountWei);
      setStatus(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      setStatus('Transfer successful!');
      loadBalances();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const createToken = async (name, symbol) => {
    setLoading(true);
    setStatus('Creating token...');
    try {
      const factory = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.TIP20_FACTORY, TIP20_FACTORY_ABI, signer);
      const tx = await factory.createToken(name, symbol, "USD", CONFIG.TOKENS.PathUSD, account);
      setStatus(`Creation TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed && parsed.name === 'TokenCreated') {
            const tokenAddress = parsed.args.token;
            setStatus(`Token created at: ${tokenAddress}`);
            setTokenData([...tokenData, { address: tokenAddress, symbol, name }]);
            return;
          }
        } catch (e) { continue; }
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const swapTokens = async (tokenInSymbol, tokenOutSymbol, amount) => {
    setLoading(true);
    try {
      const tokenIn = CONFIG.TOKENS[tokenInSymbol];
      const tokenOut = CONFIG.TOKENS[tokenOutSymbol];
      const dex = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, signer);
      const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);
      
      const decimals = await tokenInContract.decimals();
      const amountIn = ethers.parseUnits(amount, decimals);
      
      // Approve
      const allowance = await tokenInContract.allowance(account, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX);
      if (allowance < amountIn) {
        setStatus('Approving token...');
        const approveTx = await tokenInContract.approve(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      // Get quote
      const expectedOut = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
      const minOut = (expectedOut * 99n) / 100n;
      
      setStatus('Swapping...');
      const tx = await dex.swapExactAmountIn(tokenIn, tokenOut, amountIn, minOut);
      setStatus(`Swap TX: ${tx.hash}`);
      await tx.wait();
      setStatus('Swap successful!');
      loadBalances();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const addLiquidity = async (userToken, validatorToken, amount) => {
    setLoading(true);
    try {
      const feeManager = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, FEE_MANAGER_ABI, signer);
      const valContract = new ethers.Contract(validatorToken, ERC20_ABI, signer);
      
      const decimals = await valContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      // Approve
      const allowance = await valContract.allowance(account, CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER);
      if (allowance < amountWei) {
        setStatus('Approving token...');
        const approveTx = await valContract.approve(CONFIG.SYSTEM_CONTRACTS.FEE_MANAGER, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      setStatus('Adding liquidity...');
      const tx = await feeManager.mintWithValidatorToken(userToken, validatorToken, amountWei, account);
      setStatus(`TX: ${tx.hash}`);
      await tx.wait();
      setStatus('Liquidity added!');
      loadBalances();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const registerDomain = async (domainName) => {
    setLoading(true);
    try {
      const infinity = new ethers.Contract(CONFIG.INFINITY_NAME_CONTRACT, INFINITY_NAME_ABI, signer);
      const pathUsd = new ethers.Contract(CONFIG.TOKENS.PathUSD, ERC20_ABI, signer);
      
      // Approve PathUSD
      const decimals = await pathUsd.decimals();
      const amount = ethers.parseUnits("1000", decimals);
      
      const allowance = await pathUsd.allowance(account, CONFIG.INFINITY_NAME_CONTRACT);
      if (allowance < amount) {
        setStatus('Approving PathUSD...');
        const approveTx = await pathUsd.approve(CONFIG.INFINITY_NAME_CONTRACT, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      setStatus('Registering domain...');
      const tx = await infinity.register(domainName, ethers.ZeroAddress);
      setStatus(`TX: ${tx.hash}`);
      await tx.wait();
      setStatus(`Domain ${domainName}.tempo registered!`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const placeLimitOrder = async (tokenSymbol, amount, isBid) => {
    setLoading(true);
    try {
      const token = CONFIG.TOKENS[tokenSymbol];
      const dex = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, signer);
      
      const tokenToApprove = isBid ? CONFIG.TOKENS.PathUSD : token;
      const tokenContract = new ethers.Contract(tokenToApprove, ERC20_ABI, signer);
      
      const amountWei = ethers.parseUnits(amount, 6);
      
      // Approve
      const allowance = await tokenContract.allowance(account, CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX);
      if (allowance < amountWei) {
        setStatus('Approving token...');
        const approveTx = await tokenContract.approve(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      setStatus('Placing order...');
      const tx = await dex.place(token, amountWei, isBid, 0, { gasLimit: 3000000 });
      setStatus(`TX: ${tx.hash}`);
      await tx.wait();
      setStatus('Order placed!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  // Feature Components
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome to Tempo Bot</h2>
        <p className="text-purple-100">Your all-in-one DeFi automation platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(balances).map(([symbol, balance]) => (
          <div key={symbol} className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-gray-500 text-sm">{symbol}</div>
            <div className="text-2xl font-bold text-gray-800">{parseFloat(balance).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <button
        onClick={claimFaucet}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? 'Processing...' : '💧 Claim from Faucet'}
      </button>
    </div>
  );

  const SendTokenView = () => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('1');
    const [selectedToken, setSelectedToken] = useState('PathUSD');

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Send Tokens</h3>
        
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          {Object.keys(CONFIG.TOKENS).map(token => (
            <option key={token} value={token}>{token}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <button
          onClick={() => sendToken(selectedToken, recipient, amount)}
          disabled={loading || !recipient}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    );
  };

  const CreateTokenView = () => {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Create Stablecoin</h3>
        
        <input
          type="text"
          placeholder="Token Name (e.g., Alpha Dollar)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Symbol (e.g., AUSD)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <button
          onClick={() => createToken(name, symbol)}
          disabled={loading || !name || !symbol}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          Create Token
        </button>

        {tokenData.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-gray-700">Your Tokens:</h4>
            {tokenData.map((token, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium">{token.name} ({token.symbol})</div>
                <div className="text-sm text-gray-500">{token.address}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SwapView = () => {
    const [tokenIn, setTokenIn] = useState('PathUSD');
    const [tokenOut, setTokenOut] = useState('AlphaUSD');
    const [amount, setAmount] = useState('1');

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Swap Tokens</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <select
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {Object.keys(CONFIG.TOKENS).map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center">
          <ArrowRightLeft className="text-gray-400" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">To</label>
          <select
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {Object.keys(CONFIG.TOKENS).filter(t => t !== tokenIn).map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <button
          onClick={() => swapTokens(tokenIn, tokenOut, amount)}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          Swap
        </button>
      </div>
    );
  };

  const LiquidityView = () => {
    const [userToken, setUserToken] = useState(CONFIG.TOKENS.AlphaUSD);
    const [validatorToken, setValidatorToken] = useState(CONFIG.TOKENS.PathUSD);
    const [amount, setAmount] = useState('100');

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Add Liquidity</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">User Token</label>
          <select
            value={userToken}
            onChange={(e) => setUserToken(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {Object.entries(CONFIG.TOKENS).map(([name, addr]) => (
              <option key={addr} value={addr}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Validator Token</label>
          <select
            value={validatorToken}
            onChange={(e) => setValidatorToken(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {Object.entries(CONFIG.TOKENS).map(([name, addr]) => (
              <option key={addr} value={addr}>{name}</option>
            ))}
          </select>
        </div>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <button
          onClick={() => addLiquidity(userToken, validatorToken, amount)}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          Add Liquidity
        </button>
      </div>
    );
  };

  const InfinityNameView = () => {
    const [domain, setDomain] = useState('');

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Register Domain</h3>
        <p className="text-gray-600">Register a .tempo domain name</p>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter domain name"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase())}
            className="flex-1 p-3 border rounded-lg"
          />
          <div className="flex items-center px-4 bg-gray-100 rounded-lg">
            .tempo
          </div>
        </div>

        <button
          onClick={() => registerDomain(domain)}
          disabled={loading || !domain}
          className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50"
        >
          Register Domain
        </button>
      </div>
    );
  };

  const LimitOrderView = () => {
    const [token, setToken] = useState('AlphaUSD');
    const [amount, setAmount] = useState('10');
    const [orderType, setOrderType] = useState(true); // true = BID, false = ASK

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Limit Order</h3>
        
        <select
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          {Object.keys(CONFIG.TOKENS).filter(t => t !== 'PathUSD').map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setOrderType(true)}
            className={`flex-1 py-3 rounded-lg font-semibold ${orderType ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            BID (Buy)
          </button>
          <button
            onClick={() => setOrderType(false)}
            className={`flex-1 py-3 rounded-lg font-semibold ${!orderType ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            ASK (Sell)
          </button>
        </div>

        <button
          onClick={() => placeLimitOrder(token, amount, orderType)}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
        >
          Place Order
        </button>
      </div>
    );
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'create', label: 'Create Token', icon: Coins },
    { id: 'swap', label: 'Swap', icon: ArrowRightLeft },
    { id: 'liquidity', label: 'Liquidity', icon: Droplets },
    { id: 'limit', label: 'Limit Order', icon: TrendingUp },
    { id: 'domain', label: 'Domain', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Zap className="text-purple-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tempo Bot</h1>
              <p className="text-sm text-gray-500">DeFi Automation Platform</p>
            </div>
          </div>
          
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="text-xs text-gray-500">Connected</div>
              <div className="font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</div>
            </div>
          )}
        </div>
      </div>

      {!account ? (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Wallet className="mx-auto text-purple-600 mb-6" size={80} />
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
          <p className="text-xl text-gray-600 mb-8">
            Get started with Tempo Bot by connecting your MetaMask wallet
          </p>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 space-y-2">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'send' && <SendTokenView />}
                {activeTab === 'create' && <CreateTokenView />}
                {activeTab === 'swap' && <SwapView />}
                {activeTab === 'liquidity' && <LiquidityView />}
                {activeTab === 'limit' && <LimitOrderView />}
                {activeTab === 'domain' && <InfinityNameView />}
              </div>

              {/* Status Bar */}
              {status && (
                <div className={`mt-4 p-4 rounded-lg ${
                  status.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;