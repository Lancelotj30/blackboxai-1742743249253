// OTPBot Popup Script

class OTPBotPopup {
    constructor() {
        this.otpList = [];
        this.elements = {
            otpList: document.getElementById('otpList'),
            emptyState: document.getElementById('emptyState'),
            clearBtn: document.getElementById('clearBtn'),
            helpBtn: document.getElementById('helpBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            helpModal: document.getElementById('helpModal'),
            closeHelpBtn: document.getElementById('closeHelpBtn'),
            closeHelpBtn2: document.getElementById('closeHelpBtn2'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    /**
     * Initialize the popup
     */
    async init() {
        try {
            this.setupEventListeners();
            await this.loadOTPs();
            this.setupMessageListener();
        } catch (error) {
            console.error('[OTPBot Error] Popup initialization failed:', error);
            this.showToast('Failed to initialize popup', 'error');
        }
    }

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Clear button
        this.elements.clearBtn.addEventListener('click', () => this.clearOTPs());

        // Help modal
        this.elements.helpBtn.addEventListener('click', () => this.toggleHelpModal(true));
        this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelpModal(false));
        this.elements.closeHelpBtn2.addEventListener('click', () => this.toggleHelpModal(false));
        
        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        // Close help modal when clicking outside
        this.elements.helpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.helpModal) {
                this.toggleHelpModal(false);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.helpModal.style.display !== 'none') {
                this.toggleHelpModal(false);
            }
        });
    }

    /**
     * Load OTPs from storage
     */
    async loadOTPs() {
        try {
            const data = await chrome.storage.local.get('otpList');
            this.otpList = data.otpList || [];
            this.renderOTPList();
        } catch (error) {
            console.error('[OTPBot Error] Failed to load OTPs:', error);
            this.showToast('Failed to load OTPs', 'error');
        }
    }

    /**
     * Set up listener for runtime messages
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'OTP_LIST_UPDATED') {
                this.otpList = message.otpList;
                this.renderOTPList();
            }
        });
    }

    /**
     * Render the OTP list in the popup
     */
    renderOTPList() {
        try {
            this.elements.otpList.innerHTML = '';
            this.elements.emptyState.style.display = this.otpList.length ? 'none' : 'block';

            this.otpList.forEach((item, index) => {
                const otpCard = this.createOTPCard(item, index);
                this.elements.otpList.appendChild(otpCard);
            });
        } catch (error) {
            console.error('[OTPBot Error] Failed to render OTP list:', error);
            this.showToast('Failed to display OTPs', 'error');
        }
    }

    /**
     * Create an OTP card element
     */
    createOTPCard(item, index) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow';
        
        const time = new Date(item.timestamp).toLocaleTimeString();
        const domain = new URL(item.url).hostname;
        
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="text-xl font-semibold font-mono">${item.otp}</div>
                    <div class="text-sm text-gray-500 mt-1 flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        <span>${time}</span>
                    </div>
                    <div class="text-sm text-gray-500 truncate flex items-center mt-1">
                        <i class="fas fa-link mr-1"></i>
                        <span title="${item.url}">${domain}</span>
                    </div>
                </div>
                <button class="copy-btn text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50" 
                        title="Copy OTP">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;

        // Add click handler for copy button
        const copyBtn = div.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.copyOTP(item.otp);
            
            // Visual feedback
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.replace('text-blue-600', 'text-green-600');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.classList.replace('text-green-600', 'text-blue-600');
            }, 1500);
        });

        return div;
    }

    /**
     * Copy OTP to clipboard
     */
    async copyOTP(otp) {
        try {
            await navigator.clipboard.writeText(otp);
            this.showToast('OTP copied to clipboard!');
        } catch (error) {
            console.error('[OTPBot Error] Failed to copy OTP:', error);
            this.showToast('Failed to copy OTP', 'error');
        }
    }

    /**
     * Clear all OTPs
     */
    async clearOTPs() {
        try {
            await chrome.storage.local.set({ otpList: [] });
            this.otpList = [];
            this.renderOTPList();
            this.showToast('All OTPs cleared');
        } catch (error) {
            console.error('[OTPBot Error] Failed to clear OTPs:', error);
            this.showToast('Failed to clear OTPs', 'error');
        }
    }

    /**
     * Toggle help modal visibility
     */
    toggleHelpModal(show) {
        this.elements.helpModal.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show a toast notification
     */
    showToast(message, type = 'success') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-30 ${
            type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        } text-white`;
        
        this.elements.toast.style.display = 'block';
        setTimeout(() => {
            this.elements.toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const popup = new OTPBotPopup();
    popup.init();
});