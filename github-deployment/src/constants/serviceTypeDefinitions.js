// Comprehensive service type definitions with investigative information
export const SERVICE_TYPE_DEFINITIONS = {
  'CEX': {
    label: 'CEX',
    color: 'blue',
    shortDescription: 'Centralized Exchange - Custodial service with full KYC and transaction records',
    fullName: 'Centralized Exchange',
    overview: 'A centralized exchange (CEX) is a custodial platform where the exchange controls users\' private keys and manages all transactions through their internal systems.',
    custodyType: 'Fully Custodial',
    capabilities: {
      freezeAssets: true,
      provideKYC: true,
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true
    },
    services: [
      'Spot Trading',
      'P2P Trading (facilitated)',
      'Fiat On-ramping',
      'Fiat Off-ramping',
      'Staking Services',
      'Lending/Borrowing',
      'Custody Services'
    ],
    investigativeValue: {
      recordTypes: [
        'Complete KYC information (ID, address, phone, email)',
        'Full transaction history (deposits, withdrawals, trades)',
        'IP addresses and device information',
        'Login history and security events',
        'Internal transfer records',
        'Fiat banking connections',
        'Communication records with support'
      ],
      dataLocation: 'Off-chain - All data stored in internal business records',
      responseTime: 'Typically 5-10 business days with proper legal process',
      limitations: 'Cannot provide information about transactions that occur outside their platform'
    },
    legalRequirements: 'Usually accepts subpoenas or court orders; some accept law enforcement requests on letterhead',
    examples: 'Coinbase, Binance.US, Kraken, Gemini'
  },
  
  'DEX': {
    label: 'DEX',
    color: 'purple',
    shortDescription: 'Decentralized Exchange - Non-custodial protocol, limited user data',
    fullName: 'Decentralized Exchange',
    overview: 'A decentralized exchange (DEX) is typically a non-custodial protocol that operates on-chain through smart contracts, allowing peer-to-peer trading without intermediaries.',
    custodyType: 'Non-Custodial (Protocol Level)',
    capabilities: {
      freezeAssets: false,
      provideKYC: false,
      provideTransactionHistory: false,
      provideIPLogs: false,
      blockAddresses: true // Some can blacklist addresses at protocol level
    },
    services: [
      'Token Swaps',
      'Liquidity Provision',
      'Yield Farming',
      'Automated Market Making'
    ],
    investigativeValue: {
      recordTypes: [
        'Smart contract interaction logs',
        'Protocol governance participation (if applicable)',
        'Front-end access logs (if operated by a company)',
        'Blacklisted addresses (if implemented)'
      ],
      dataLocation: 'On-chain - Most transaction data is publicly available on blockchain',
      responseTime: 'Limited assistance available; blockchain analysis tools more effective',
      limitations: 'Cannot freeze funds, cannot provide KYC, cannot reverse transactions'
    },
    legalRequirements: 'Limited ability to assist; may only control front-end interface',
    examples: 'Uniswap, SushiSwap, PancakeSwap, Curve',
    specialNote: 'Some "DEXs" may have hybrid models with custodial features for certain services'
  },
  
  'P2P': {
    label: 'P2P',
    color: 'green',
    shortDescription: 'P2P Platform - Facilitates trades between users, may have escrow',
    fullName: 'Peer-to-Peer Trading Platform',
    overview: 'P2P platforms connect buyers and sellers directly. They may hold funds in escrow during trades but generally don\'t take long-term custody.',
    custodyType: 'Temporary Custodial (Escrow) or Non-Custodial',
    capabilities: {
      freezeAssets: true, // During escrow period
      provideKYC: true,
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: false
    },
    services: [
      'User Matching',
      'Escrow Services',
      'Dispute Resolution',
      'Reputation Systems',
      'Payment Method Integration'
    ],
    investigativeValue: {
      recordTypes: [
        'Trader KYC information',
        'Trade history and counterparties',
        'Chat/communication logs between traders',
        'Payment method details',
        'Dispute records',
        'User ratings and feedback',
        'IP addresses and access logs'
      ],
      dataLocation: 'Off-chain - Platform database',
      responseTime: 'Varies; typically 5-15 business days',
      limitations: 'May not control funds outside of active trades'
    },
    legalRequirements: 'Varies by jurisdiction; typically requires subpoena',
    examples: 'LocalBitcoins (closed), Paxful, Bisq (decentralized)'
  },
  
  'Kiosk': {
    label: 'Kiosk',
    color: 'yellow',
    shortDescription: 'Crypto ATM/Kiosk - Physical terminals with transaction logs',
    fullName: 'Cryptocurrency Kiosk/ATM',
    overview: 'Physical terminals that allow users to buy or sell cryptocurrency using cash or cards. Operators maintain transaction records and often have camera surveillance.',
    custodyType: 'Non-Custodial (Immediate transfer)',
    capabilities: {
      freezeAssets: false,
      provideKYC: true, // Varies by jurisdiction
      provideTransactionHistory: true,
      provideIPLogs: false,
      blockAddresses: true // Can block addresses from using their machines
    },
    services: [
      'Cash to Crypto',
      'Crypto to Cash',
      'Crypto to Crypto exchanges',
      'Prepaid card purchases'
    ],
    investigativeValue: {
      recordTypes: [
        'Transaction records (amount, address, time)',
        'KYC data (if collected - phone, ID)',
        'Camera footage',
        'Machine location and timestamp',
        'Phone numbers used for verification',
        'Cash serial numbers (in some cases)',
        'Wallet addresses used'
      ],
      dataLocation: 'Off-chain - Operator database',
      responseTime: 'Usually quick, 1-5 business days',
      limitations: 'KYC requirements vary greatly by location and transaction amount'
    },
    legalRequirements: 'Typically responds to subpoenas; some accept LE requests',
    examples: 'Bitcoin Depot, CoinFlip, Coin Cloud'
  },
  
  'Bridge': {
    label: 'Bridge',
    color: 'indigo',
    shortDescription: 'Cross-chain Bridge - Connects blockchains, may have custody during transfer',
    fullName: 'Blockchain Bridge Service',
    overview: 'Bridges facilitate asset transfers between different blockchains. Some are centralized with custody, others use smart contracts and validators.',
    custodyType: 'Varies (Custodial during transfer or Non-Custodial via smart contracts)',
    capabilities: {
      freezeAssets: true, // Centralized bridges only
      provideKYC: false, // Usually no KYC
      provideTransactionHistory: true,
      provideIPLogs: true, // If centralized
      blockAddresses: true
    },
    services: [
      'Cross-chain transfers',
      'Wrapped token issuance',
      'Multi-chain liquidity',
      'Chain-specific token versions'
    ],
    investigativeValue: {
      recordTypes: [
        'Source and destination addresses',
        'Transfer amounts and timestamps',
        'Transaction hashes on both chains',
        'IP logs (centralized bridges)',
        'Blacklisted addresses',
        'Validator information (decentralized bridges)',
        'Liquidity provider data'
      ],
      dataLocation: 'Mixed - Some on-chain, some in operator databases',
      responseTime: 'Centralized: 5-10 days, Decentralized: limited assistance',
      limitations: 'Decentralized bridges have very limited ability to assist'
    },
    legalRequirements: 'Centralized bridges may respond to legal process',
    examples: 'Wormhole, Polygon Bridge, Binance Bridge',
    specialNote: 'Bridge hacks are common; stolen funds often pass through bridges'
  },
  
  'Gambling': {
    label: 'Gambling',
    color: 'red',
    shortDescription: 'Crypto Gambling - Betting platforms with game records and user data',
    fullName: 'Cryptocurrency Gambling Service',
    overview: 'Online gambling platforms accepting cryptocurrency. Range from fully licensed casinos to anonymous betting sites.',
    custodyType: 'Custodial (holds user balances)',
    capabilities: {
      freezeAssets: true,
      provideKYC: true, // Varies significantly
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true
    },
    services: [
      'Casino games',
      'Sports betting',
      'Poker',
      'Lottery/Raffles',
      'Prediction markets'
    ],
    investigativeValue: {
      recordTypes: [
        'Account information (varies from email-only to full KYC)',
        'Deposit/withdrawal history',
        'Betting history and patterns',
        'IP addresses and VPN detection',
        'Affiliate/referral connections',
        'Chat logs',
        'Bonus abuse investigations'
      ],
      dataLocation: 'Off-chain - Platform database',
      responseTime: 'Highly variable; licensed operators respond faster',
      limitations: 'Unlicensed operators may not respond to legal process'
    },
    legalRequirements: 'Licensed operators follow local regulations; others may ignore requests',
    examples: 'Stake.com, BitStarz, FortuneJack',
    specialNote: 'Money laundering risk; often used to obfuscate fund sources'
  },
  
  'Wallet': {
    label: 'Wallet',
    color: 'gray',
    shortDescription: 'Wallet Provider - Custodial wallet service with user accounts',
    fullName: 'Custodial Wallet Provider',
    overview: 'Services that provide cryptocurrency wallet functionality while maintaining custody of user funds. Different from non-custodial wallet software.',
    custodyType: 'Fully Custodial',
    capabilities: {
      freezeAssets: true,
      provideKYC: true,
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true
    },
    services: [
      'Asset custody',
      'Send/receive functionality',
      'Currency conversion',
      'Payment processing',
      'Merchant services'
    ],
    investigativeValue: {
      recordTypes: [
        'Full KYC information',
        'Complete transaction history',
        'IP and device logs',
        'Linked bank accounts/cards',
        'Internal transfer records',
        'Account recovery information',
        'API usage logs'
      ],
      dataLocation: 'Off-chain - Service provider database',
      responseTime: 'Typically 5-10 business days',
      limitations: 'Cannot provide info on self-custody wallets'
    },
    legalRequirements: 'Usually compliant with legal requests',
    examples: 'Blockchain.com (custodial), BitPay, Crypto.com Wallet'
  },
  
  'OTC': {
    label: 'OTC',
    color: 'orange',
    shortDescription: 'OTC Desk - Large volume trades with enhanced KYC',
    fullName: 'Over-The-Counter Trading Desk',
    overview: 'OTC desks facilitate large cryptocurrency trades outside of public exchanges, often with enhanced KYC and direct settlement.',
    custodyType: 'Varies (Often non-custodial with settlement services)',
    capabilities: {
      freezeAssets: false, // Usually don't hold custody
      provideKYC: true, // Enhanced KYC
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: false
    },
    services: [
      'Large block trades',
      'Price negotiation',
      'Settlement services',
      'Liquidity provision',
      'Cross-asset trades'
    ],
    investigativeValue: {
      recordTypes: [
        'Enhanced KYC (often includes wealth source)',
        'Trade history and counterparties',
        'Settlement instructions',
        'Banking information',
        'Communication records',
        'Compliance documentation',
        'Source of funds documentation'
      ],
      dataLocation: 'Off-chain - Business records',
      responseTime: 'Generally responsive, 5-15 business days',
      limitations: 'May have confidentiality agreements with clients'
    },
    legalRequirements: 'Typically requires formal legal process',
    examples: 'Genesis Trading, Circle Trade, Kraken OTC'
  },
  
  'Mining': {
    label: 'Mining',
    color: 'cyan',
    shortDescription: 'Mining Pool - Coordinates miners, distributes rewards',
    fullName: 'Cryptocurrency Mining Pool',
    overview: 'Mining pools aggregate computational power from multiple miners to increase chances of mining blocks and distribute rewards.',
    custodyType: 'Temporary Custodial (for rewards distribution)',
    capabilities: {
      freezeAssets: true, // Can freeze pending payouts
      provideKYC: false, // Usually no KYC
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true // Can block payout addresses
    },
    services: [
      'Mining coordination',
      'Reward distribution',
      'Hash rate rental',
      'Mining statistics'
    ],
    investigativeValue: {
      recordTypes: [
        'Miner addresses and payout history',
        'Hash rate contributions',
        'IP addresses of miners',
        'Payout schedules and amounts',
        'Mining equipment identifiers',
        'Account email addresses',
        'Withdrawal addresses'
      ],
      dataLocation: 'Mixed - Blockchain and pool database',
      responseTime: 'Variable, often slow to respond',
      limitations: 'Minimal KYC; miners often pseudonymous'
    },
    legalRequirements: 'Varies greatly by jurisdiction',
    examples: 'F2Pool, Poolin, AntPool'
  },
  
  'Payment': {
    label: 'Payment',
    color: 'teal',
    shortDescription: 'Payment Processor - Crypto payment gateway for merchants',
    fullName: 'Cryptocurrency Payment Processor',
    overview: 'Services that enable merchants to accept cryptocurrency payments, often with instant conversion to fiat.',
    custodyType: 'Temporary Custodial',
    capabilities: {
      freezeAssets: true, // During processing
      provideKYC: true, // Merchant KYC
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true
    },
    services: [
      'Payment processing',
      'Instant conversion',
      'Invoice generation',
      'Refund handling',
      'Multi-currency support'
    ],
    investigativeValue: {
      recordTypes: [
        'Merchant KYC information',
        'Transaction records and invoices',
        'Customer payment addresses',
        'IP addresses (if collected)',
        'Refund and dispute records',
        'Settlement records',
        'API integration logs'
      ],
      dataLocation: 'Off-chain - Processor database',
      responseTime: 'Usually responsive, 5-10 business days',
      limitations: 'Customer information may be limited'
    },
    legalRequirements: 'Generally compliant with legal requests',
    examples: 'BitPay, CoinPayments, Coinbase Commerce'
  },
  
  'Staking': {
    label: 'Staking',
    color: 'pink',
    shortDescription: 'Staking Service - Manages staked assets for rewards',
    fullName: 'Staking Service Provider',
    overview: 'Platforms that offer staking services, allowing users to earn rewards by locking up proof-of-stake cryptocurrencies.',
    custodyType: 'Custodial or Non-Custodial',
    capabilities: {
      freezeAssets: true, // If custodial
      provideKYC: true, // If custodial
      provideTransactionHistory: true,
      provideIPLogs: true, // If custodial
      blockAddresses: false
    },
    services: [
      'Staking pool operation',
      'Reward distribution',
      'Validator services',
      'Liquid staking tokens'
    ],
    investigativeValue: {
      recordTypes: [
        'Staker identities (if custodial)',
        'Staking amounts and duration',
        'Reward distribution history',
        'Validator performance data',
        'Withdrawal addresses',
        'Delegation records'
      ],
      dataLocation: 'Mixed - Some on-chain, some off-chain',
      responseTime: 'Custodial: 5-10 days, Non-custodial: limited',
      limitations: 'Non-custodial staking offers minimal assistance'
    },
    legalRequirements: 'Custodial services typically comply',
    examples: 'Lido, Rocket Pool, Kraken Staking'
  },
  
  'Lending': {
    label: 'Lending',
    color: 'amber',
    shortDescription: 'Lending Platform - Crypto loans and interest accounts',
    fullName: 'Cryptocurrency Lending Platform',
    overview: 'Platforms offering cryptocurrency loans, either peer-to-peer or through centralized lending pools.',
    custodyType: 'Typically Custodial',
    capabilities: {
      freezeAssets: true,
      provideKYC: true,
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true
    },
    services: [
      'Crypto-backed loans',
      'Interest accounts',
      'Margin lending',
      'Institutional lending'
    ],
    investigativeValue: {
      recordTypes: [
        'Borrower/lender KYC',
        'Loan terms and history',
        'Collateral records',
        'Interest payments',
        'Liquidation events',
        'Account statements',
        'Source of funds for large deposits'
      ],
      dataLocation: 'Off-chain - Platform database',
      responseTime: 'Generally responsive, 5-15 business days',
      limitations: 'DeFi lending protocols have minimal data'
    },
    legalRequirements: 'CeFi platforms typically comply with legal process',
    examples: 'BlockFi (bankrupt), Celsius (bankrupt), Aave (DeFi)'
  },
  
  'NFT': {
    label: 'NFT',
    color: 'violet',
    shortDescription: 'NFT Marketplace - Digital collectibles trading platform',
    fullName: 'NFT Marketplace',
    overview: 'Platforms for minting, buying, selling, and trading non-fungible tokens (NFTs).',
    custodyType: 'Usually Non-Custodial',
    capabilities: {
      freezeAssets: false, // NFTs typically in user wallets
      provideKYC: false, // Usually minimal
      provideTransactionHistory: true,
      provideIPLogs: true,
      blockAddresses: true // Can delist/ban
    },
    services: [
      'NFT listings',
      'Auction services',
      'Minting services',
      'Royalty distribution',
      'Collection verification'
    ],
    investigativeValue: {
      recordTypes: [
        'Account information (often just wallet + email)',
        'Listing and sale history',
        'IP addresses',
        'Uploaded content/metadata',
        'Communication between users',
        'Royalty payment records',
        'DMCA/fraud reports'
      ],
      dataLocation: 'Mixed - Transactions on-chain, metadata off-chain',
      responseTime: 'Variable, often slow',
      limitations: 'Limited KYC; users often pseudonymous'
    },
    legalRequirements: 'Varies; major platforms may comply',
    examples: 'OpenSea, Rarible, Magic Eden'
  },
  
  'Stablecoin': {
    label: 'Stablecoin',
    color: 'emerald',
    shortDescription: 'Stablecoin Issuer - Mints/redeems stable value tokens',
    fullName: 'Stablecoin Issuer',
    overview: 'Entities that issue stablecoins backed by fiat currency, crypto assets, or algorithms.',
    custodyType: 'Custodial (of backing assets)',
    capabilities: {
      freezeAssets: true, // Can freeze at token level
      provideKYC: true, // For direct customers
      provideTransactionHistory: true,
      provideIPLogs: false,
      blockAddresses: true // Can blacklist at smart contract level
    },
    services: [
      'Stablecoin minting',
      'Redemption services',
      'Reserve management',
      'Compliance services'
    ],
    investigativeValue: {
      recordTypes: [
        'Direct customer KYC (banks, exchanges)',
        'Minting/redemption records',
        'Blacklisted addresses',
        'Reserve audit reports',
        'Large transaction reports',
        'Compliance investigations'
      ],
      dataLocation: 'Mixed - Smart contract data on-chain, KYC off-chain',
      responseTime: 'Generally responsive to law enforcement',
      limitations: 'Only have KYC for direct customers, not all token holders'
    },
    legalRequirements: 'Major issuers comply with legal requests and sanctions',
    examples: 'Circle (USDC), Tether (USDT), Paxos (USDP)',
    specialNote: 'Can freeze tokens globally via smart contract blacklist'
  },
  
  'Mixer': {
    label: 'Mixer',
    color: 'rose',
    shortDescription: 'Mixing Service - Obfuscates transaction trails (High Risk)',
    fullName: 'Cryptocurrency Mixing/Tumbling Service',
    overview: 'Services designed to obfuscate the source and destination of cryptocurrency transactions by mixing funds from multiple users.',
    custodyType: 'Temporary Custodial',
    capabilities: {
      freezeAssets: false, // Generally don't freeze
      provideKYC: false, // Anonymity is the service
      provideTransactionHistory: false, // Limited logs
      provideIPLogs: false, // Often use Tor
      blockAddresses: false
    },
    services: [
      'Transaction mixing',
      'CoinJoin coordination',
      'Privacy enhancement',
      'Chain-hopping'
    ],
    investigativeValue: {
      recordTypes: [
        'Limited or no records kept',
        'Possibly entry/exit addresses',
        'Service fees collected',
        'Timing analysis data'
      ],
      dataLocation: 'Minimal data retention by design',
      responseTime: 'Unlikely to respond to law enforcement',
      limitations: 'Designed to prevent tracing; often used for illicit purposes'
    },
    legalRequirements: 'Many are sanctioned or operate illegally',
    examples: 'Tornado Cash (sanctioned), Bitcoin Fog (shut down), Wasabi Wallet',
    specialNote: 'HIGH RISK - Often associated with money laundering and sanctions evasion'
  }
};

// Helper function to get color classes for Tailwind
export const getServiceTypeColorClasses = (color) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200'
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
};