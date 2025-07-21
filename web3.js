// Web3 Integration for Goemon Token Website
class GoemeonWeb3 {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.walletAdapter = null;
        this.tokenMint = null; // Will be set when token is deployed
        this.connected = false;
        
        // Initialize Solana connection with working RPC endpoints
        this.rpcEndpoints = [
            'https://rpc.ankr.com/solana',                 // Ankr public (no key needed for basic queries)
            'https://solana.public-rpc.com',               // Public RPC
            'https://api.mainnet-beta.solana.com',         // Official Solana
            'https://rpc.shyft.to',                        // Shyft public endpoint
            'https://solana-rpc.publicnode.com'            // PublicNode
        ];
        this.currentRpcIndex = 0;
        this.connection = new solanaWeb3.Connection(
            this.rpcEndpoints[this.currentRpcIndex],
            'confirmed'
        );
        
        this.init();
    }
    
    init() {
        this.setupWalletListeners();
        this.checkWalletConnection();
        this.updateUI();
    }
    
    // Check if wallet is already connected
    async checkWalletConnection() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                    this.wallet = response.publicKey;
                    this.connected = true;
                    this.updateUI();
                    await this.getTokenBalance();
                }
            } catch (error) {
                console.log('No existing connection found');
            }
        }
    }
    
    // Connect to Phantom wallet
    async connectPhantom() {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                alert('Phantom wallet not found! Please install Phantom wallet extension.');
                window.open('https://phantom.app/', '_blank');
                return;
            }
            
            const response = await window.solana.connect();
            this.wallet = response.publicKey;
            this.connected = true;
            
            console.log('Connected to wallet:', this.wallet.toString());
            this.updateUI();
            
            // Show success message
            this.showNotification('Wallet connected successfully! 🥷', 'success');
            
            // Fetch and display balance
            await this.getTokenBalance();
            
        } catch (error) {
            console.error('Error connecting to Phantom:', error);
            this.showNotification('Failed to connect wallet. Please try again.', 'error');
        }
    }
    
    // Connect to Solflare wallet
    async connectSolflare() {
        try {
            if (!window.solflare || !window.solflare.isSolflare) {
                alert('Solflare wallet not found! Please install Solflare wallet extension.');
                window.open('https://solflare.com/', '_blank');
                return;
            }
            
            const response = await window.solflare.connect();
            this.wallet = response.publicKey;
            this.connected = true;
            
            console.log('Connected to Solflare:', this.wallet.toString());
            this.updateUI();
            
            this.showNotification('Solflare wallet connected! ⚡', 'success');
            
            // Fetch and display balance
            await this.getTokenBalance();
            
        } catch (error) {
            console.error('Error connecting to Solflare:', error);
            this.showNotification('Failed to connect Solflare wallet.', 'error');
        }
    }
    
    // Disconnect wallet
    async disconnect() {
        try {
            if (window.solana && this.connected) {
                await window.solana.disconnect();
            }
            
            this.wallet = null;
            this.connected = false;
            this.updateUI();
            
            this.showNotification('Wallet disconnected', 'info');
            
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
        }
    }
    
    // Switch to next RPC endpoint if current one fails
    switchRpcEndpoint() {
        this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcEndpoints.length;
        console.log(`Switching to RPC endpoint: ${this.rpcEndpoints[this.currentRpcIndex]}`);
        this.connection = new solanaWeb3.Connection(
            this.rpcEndpoints[this.currentRpcIndex],
            'confirmed'
        );
    }
    
    // Get real-time SOL balance with robust retry mechanism
    async getSolBalance() {
        if (!this.wallet) {
            console.log('Wallet not available');
            return 0;
        }
        
        console.log('Fetching real SOL balance for:', this.wallet.toString());
        
        // Convert wallet to PublicKey if needed
        const publicKey = typeof this.wallet === 'string' 
            ? new solanaWeb3.PublicKey(this.wallet) 
            : this.wallet;
        
        // Try each RPC endpoint until one works
        for (let i = 0; i < this.rpcEndpoints.length; i++) {
            try {
                const endpoint = this.rpcEndpoints[i];
                console.log(`Trying endpoint ${i + 1}/${this.rpcEndpoints.length}: ${endpoint}`);
                
                // Create fresh connection for each attempt
                const connection = new solanaWeb3.Connection(endpoint, 'confirmed');
                
                // Set a reasonable timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                );
                
                const balancePromise = connection.getBalance(publicKey);
                const balance = await Promise.race([balancePromise, timeoutPromise]);
                
                const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
                console.log(`✅ Success! SOL balance: ${solBalance} (from ${endpoint})`);
                
                // Update our main connection to the working endpoint
                this.currentRpcIndex = i;
                this.connection = connection;
                
                return solBalance;
                
            } catch (error) {
                console.log(`❌ Endpoint ${i + 1} failed: ${error.message}`);
                // Continue to next endpoint
            }
        }
        
        // If all endpoints failed, show error
        console.error('All RPC endpoints failed to fetch balance');
        this.showNotification('Unable to fetch balance from any RPC endpoint 📡', 'error');
        return 'Unable to fetch';
    }
    
    // Get SOL balance and update UI
    async getTokenBalance() {
        if (!this.wallet) return 0;
        
        try {
            const solBalance = await this.getSolBalance();
            
            // Update main balance display in hero section
            const heroBalanceElement = document.querySelector('#sol-balance-display');
            if (heroBalanceElement) {
                if (solBalance === 'Unable to fetch') {
                    heroBalanceElement.innerHTML = `Unable to fetch <button onclick="goemonWeb3.getTokenBalance()" style="background: #ff9800; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 8px;">↻ Retry</button>`;
                } else {
                    heroBalanceElement.textContent = `${solBalance.toFixed(4)} SOL`;
                }
            }
            
            // Update small balance display in nav (if exists)
            const navBalanceElement = document.querySelector('.wallet-balance');
            if (navBalanceElement) {
                if (solBalance === 'Unable to fetch') {
                    navBalanceElement.textContent = 'RPC Error';
                } else {
                    navBalanceElement.textContent = `${solBalance.toFixed(4)} SOL`;
                }
            }
            
            return solBalance;
        } catch (error) {
            console.error('Error in getTokenBalance:', error);
            
            // Show error in both UI elements
            const heroBalanceElement = document.querySelector('#sol-balance-display');
            if (heroBalanceElement) {
                heroBalanceElement.innerHTML = `Error loading <button onclick="goemonWeb3.getTokenBalance()" style="background: #ff9800; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 8px;">↻ Retry</button>`;
            }
            
            const navBalanceElement = document.querySelector('.wallet-balance');
            if (navBalanceElement) {
                navBalanceElement.textContent = 'Error';
            }
            
            return 0;
        }
    }
    
    // Update UI based on wallet connection status
    updateUI() {
        const walletBtn = document.querySelector('.wallet-btn');
        const walletInfo = document.querySelector('.wallet-info');
        const walletStatusDisplay = document.querySelector('#wallet-status-display');
        const walletAddressDisplay = document.querySelector('#wallet-address-display');
        
        if (!walletBtn) return;
        
        if (this.connected && this.wallet) {
            const shortAddress = this.wallet.toString().slice(0, 4) + '...' + this.wallet.toString().slice(-4);
            const fullAddress = this.wallet.toString();
            
            // Update nav button
            walletBtn.textContent = shortAddress;
            walletBtn.classList.add('connected');
            
            // Show prominent wallet status display
            if (walletStatusDisplay) {
                walletStatusDisplay.style.display = 'block';
            }
            
            // Update wallet address in hero section
            if (walletAddressDisplay) {
                walletAddressDisplay.textContent = shortAddress;
                walletAddressDisplay.setAttribute('data-full-address', fullAddress);
            }
            
            // Create small wallet info in nav if it doesn't exist
            if (!walletInfo) {
                this.createWalletInfo();
            }
            
            // Fetch balance after UI updates
            this.getTokenBalance();
        } else {
            walletBtn.textContent = 'Connect Wallet';
            walletBtn.classList.remove('connected');
            
            // Hide wallet status display
            if (walletStatusDisplay) {
                walletStatusDisplay.style.display = 'none';
            }
            
            // Reset wallet address display
            if (walletAddressDisplay) {
                walletAddressDisplay.textContent = 'Not Connected';
                walletAddressDisplay.removeAttribute('data-full-address');
            }
            
            // Remove nav wallet info if exists
            if (walletInfo) {
                walletInfo.remove();
            }
        }
    }
    
    // Create wallet info display
    createWalletInfo() {
        const nav = document.querySelector('nav');
        const walletInfo = document.createElement('div');
        walletInfo.className = 'wallet-info';
        walletInfo.innerHTML = `
            <div class="wallet-balance">Loading...</div>
            <button class="disconnect-btn" onclick="goemonWeb3.disconnect()">×</button>
        `;
        
        nav.appendChild(walletInfo);
    }
    
    // Setup wallet event listeners
    setupWalletListeners() {
        // Listen for wallet events
        if (window.solana) {
            window.solana.on('connect', () => {
                console.log('Wallet connected event');
                this.connected = true;
                this.updateUI();
            });
            
            window.solana.on('disconnect', () => {
                console.log('Wallet disconnected event');
                this.connected = false;
                this.wallet = null;
                this.updateUI();
            });
        }
    }
    
    // Show notification to user
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Buy tokens via Jupiter Terminal
    async buyTokens() {
        if (!this.connected) {
            this.showNotification('Please connect your wallet first!', 'warning');
            return;
        }
        
        try {
            // Create Jupiter Terminal modal
            this.createJupiterModal();
            this.showNotification('Jupiter Terminal loaded! Complete your swap 🚀', 'info');
        } catch (error) {
            console.error('Error loading Jupiter Terminal:', error);
            this.showNotification('Jupiter Terminal unavailable. Try direct swap on Jupiter.ag', 'error');
            
            // Fallback to Jupiter website
            window.open('https://jup.ag/swap/SOL-GOEMON', '_blank');
        }
    }
    
    // Create Jupiter Terminal modal
    createJupiterModal() {
        // Remove existing modal if present
        const existingModal = document.querySelector('.jupiter-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'jupiter-modal';
        modal.innerHTML = `
            <div class="jupiter-modal-content">
                <div class="jupiter-header">
                    <h3>Swap SOL to GOEMON</h3>
                    <button class="close-jupiter" onclick="closeJupiterModal()">×</button>
                </div>
                <div class="jupiter-terminal-container">
                    <div class="jupiter-placeholder">
                        <div class="swap-interface">
                            <div class="swap-input">
                                <label>You're paying</label>
                                <div class="input-group">
                                    <input type="number" placeholder="0.0" id="sol-input" step="0.01" min="0">
                                    <span class="token-symbol">SOL</span>
                                </div>
                            </div>
                            <div class="swap-arrow">⇄</div>
                            <div class="swap-output">
                                <label>You'll receive (estimated)</label>
                                <div class="input-group">
                                    <input type="number" placeholder="0.0" id="goemon-output" readonly>
                                    <span class="token-symbol">GOEMON</span>
                                </div>
                            </div>
                            <div class="swap-info">
                                <p><strong>Note:</strong> GOEMON token contract address will be revealed at launch</p>
                                <p>This is a demo interface. Actual swapping will be available post-launch.</p>
                            </div>
                            <button class="swap-button" onclick="executeSwap()">
                                Swap (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add input listener for estimation
        const solInput = document.getElementById('sol-input');
        const goemocOutput = document.getElementById('goemon-output');
        
        solInput.addEventListener('input', (e) => {
            const solAmount = parseFloat(e.target.value) || 0;
            // Mock exchange rate (this would be real-time from Jupiter API)
            const mockRate = 1000000; // 1 SOL = 1,000,000 GOEMON (example)
            goemocOutput.value = (solAmount * mockRate).toLocaleString();
        });
    }
    
    // Get token price (pre-launch placeholder)
    async getTokenPrice() {
        try {
            // Pre-launch - show placeholder values
            return { price: 'TBD', change24h: 'Launch Soon' };
        } catch (error) {
            console.error('Error fetching token price:', error);
            return { price: 'TBD', change24h: '--' };
        }
    }
    
    // Update price display for pre-launch
    async updatePriceDisplay() {
        const priceData = await this.getTokenPrice();
        const priceElement = document.querySelector('.token-price');
        const changeElement = document.querySelector('.price-change');
        
        if (priceElement) {
            priceElement.textContent = priceData.price;
        }
        
        if (changeElement) {
            changeElement.textContent = priceData.change24h;
            changeElement.className = 'price-change launch-pending';
        }
    }
}

// Initialize Web3 integration
let goemonWeb3;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Web3
    goemonWeb3 = new GoemeonWeb3();
    
    // Initialize music controls
    initializeMusicControls();
    
    // Setup wallet connection buttons
    const walletBtn = document.querySelector('.wallet-btn');
    if (walletBtn) {
        walletBtn.addEventListener('click', function() {
            if (goemonWeb3.connected) {
                // Show wallet options or disconnect
                showWalletOptions();
            } else {
                // Connect to Phantom by default
                goemonWeb3.connectPhantom();
            }
        });
    }
    
    // Setup buy buttons
    const buyButtons = document.querySelectorAll('.btn-primary, .cta-primary');
    buyButtons.forEach(btn => {
        if (btn.textContent.includes('Buy') || btn.textContent.includes('Join')) {
            btn.addEventListener('click', function() {
                goemonWeb3.buyTokens();
            });
        }
    });
    
    // Update price every 30 seconds
    goemonWeb3.updatePriceDisplay();
    setInterval(() => {
        goemonWeb3.updatePriceDisplay();
    }, 30000);
    
    // Update balance every 60 seconds if connected (reduced to avoid rate limits)
    setInterval(async () => {
        if (goemonWeb3.connected) {
            await goemonWeb3.getTokenBalance();
        }
    }, 60000);
});

// Show wallet connection options
function showWalletOptions() {
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <h3>Choose Wallet</h3>
            <button class="wallet-option" onclick="goemonWeb3.connectPhantom(); closeWalletModal();">
                <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="Phantom" width="24" height="24">
                Phantom
            </button>
            <button class="wallet-option" onclick="goemonWeb3.connectSolflare(); closeWalletModal();">
                <img src="https://solflare.com/img/solflare-icon.svg" alt="Solflare" width="24" height="24">
                Solflare
            </button>
            ${goemonWeb3.connected ? '<button class="wallet-option disconnect" onclick="goemonWeb3.disconnect(); closeWalletModal();">Disconnect</button>' : ''}
            <button class="close-modal" onclick="closeWalletModal();">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close wallet modal
function closeWalletModal() {
    const modal = document.querySelector('.wallet-modal');
    if (modal) {
        modal.remove();
    }
}

// Copy contract address functionality
function copyContract() {
    const contractAddress = 'TBD - Contract address will be revealed at launch';
    navigator.clipboard.writeText(contractAddress).then(() => {
        goemonWeb3.showNotification('Contract address copied! 📋', 'success');
    });
}

// Close Jupiter modal
function closeJupiterModal() {
    const modal = document.querySelector('.jupiter-modal');
    if (modal) {
        modal.remove();
    }
}

// Execute swap (placeholder)
function executeSwap() {
    goemonWeb3.showNotification('Swap functionality will be available at token launch! 🚀', 'info');
}

// Copy wallet address functionality
function copyWalletAddress() {
    const walletAddressDisplay = document.querySelector('#wallet-address-display');
    const fullAddress = walletAddressDisplay?.getAttribute('data-full-address');
    
    if (fullAddress && goemonWeb3.connected) {
        navigator.clipboard.writeText(fullAddress).then(() => {
            goemonWeb3.showNotification('Wallet address copied! 📋', 'success');
        }).catch(() => {
            goemonWeb3.showNotification('Failed to copy address', 'error');
        });
    } else {
        goemonWeb3.showNotification('No wallet connected', 'warning');
    }
}

// Music Control Functions
function toggleMusic() {
    const audio = document.getElementById('backgroundMusic');
    const musicBtn = document.getElementById('musicControlBtn');
    
    if (!audio) {
        console.error('Background music element not found');
        return;
    }
    
    if (audio.paused) {
        // Play music
        audio.play().then(() => {
            musicBtn.textContent = '🎵';
            musicBtn.classList.remove('muted');
            musicBtn.title = 'Mute Music';
            localStorage.setItem('musicEnabled', 'true');
            console.log('Music started');
        }).catch(error => {
            console.error('Failed to play music:', error);
            goemonWeb3?.showNotification('Unable to play music - browser blocked autoplay', 'warning');
        });
    } else {
        // Pause music
        audio.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.add('muted');
        musicBtn.title = 'Play Music';
        localStorage.setItem('musicEnabled', 'false');
        console.log('Music paused');
    }
}

// Initialize music controls
function initializeMusicControls() {
    const audio = document.getElementById('backgroundMusic');
    const musicBtn = document.getElementById('musicControlBtn');
    
    if (!audio || !musicBtn) return;
    
    // Check user preference from localStorage
    const musicEnabled = localStorage.getItem('musicEnabled');
    
    if (musicEnabled === 'false') {
        // User previously disabled music
        audio.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.add('muted');
        musicBtn.title = 'Play Music';
    } else {
        // Default: try to play music
        audio.play().then(() => {
            musicBtn.textContent = '🎵';
            musicBtn.classList.remove('muted');
            musicBtn.title = 'Mute Music';
            localStorage.setItem('musicEnabled', 'true');
        }).catch(error => {
            console.log('Autoplay blocked - music controls ready for user interaction');
            musicBtn.textContent = '🔇';
            musicBtn.classList.add('muted');
            musicBtn.title = 'Play Music';
        });
    }
    
    // Add volume control (optional)
    audio.volume = 0.5; // Set to 50% volume
}

// Add contract verification
async function verifyContract(address) {
    try {
        // This would integrate with Solana Explorer API
        // For now, return mock verification
        return {
            verified: false,
            reason: 'Contract not yet deployed - launching soon!'
        };
    } catch (error) {
        console.error('Contract verification error:', error);
        return { verified: false, reason: 'Verification unavailable' };
    }
}