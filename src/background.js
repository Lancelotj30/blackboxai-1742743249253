// OTPBot Background Service Worker

class OTPManager {
    constructor() {
        this.otpList = [];
        this.maxStoredOTPs = 10;
    }

    /**
     * Initialize the OTP manager
     */
    async init() {
        try {
            // Load existing OTPs from storage
            const data = await chrome.storage.local.get('otpList');
            this.otpList = data.otpList || [];

            // Set up message listeners
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sender, sendResponse);
                return true; // Keep message channel open for async response
            });
        } catch (error) {
            console.error('[OTPBot Error] Manager initialization failed:', error);
        }
    }

    /**
     * Handle incoming messages from content scripts
     */
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'OTP_DETECTED':
                    await this.handleNewOTP(message);
                    sendResponse({ success: true });
                    break;
                case 'SETTINGS_UPDATED':
                    await this.handleSettingsUpdate(message.settings);
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('[OTPBot Error] Message handling failed:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Process and store a new OTP
     */
    async handleNewOTP(message) {
        try {
            const { otp, url, timestamp } = message;

            // Validate OTP format (4-6 digits)
            if (!/^\d{4,6}$/.test(otp)) {
                throw new Error('Invalid OTP format');
            }

            // Add new OTP to the beginning of the list
            this.otpList.unshift({
                otp,
                url,
                timestamp,
                copied: false
            });

            // Keep only the most recent OTPs
            this.otpList = this.otpList.slice(0, this.maxStoredOTPs);

            // Save to storage
            await chrome.storage.local.set({ otpList: this.otpList });

            // Notify any open popup
            try {
                await chrome.runtime.sendMessage({
                    type: 'OTP_LIST_UPDATED',
                    otpList: this.otpList
                });
            } catch (e) {
                // Ignore errors if popup is not open
            }
        } catch (error) {
            console.error('[OTPBot Error] Failed to handle new OTP:', error);
            throw error;
        }
    }

    /**
     * Handle settings updates
     */
    async handleSettingsUpdate(settings) {
        try {
            // Store settings
            await chrome.storage.local.set({ settings });

            // Apply auto-clear if enabled
            if (settings.enableAutoClear) {
                this.setupAutoClear();
            }

            // Apply enhanced security if enabled
            if (settings.enableEnhancedSecurity) {
                this.enforceStrictCSP();
            }
        } catch (error) {
            console.error('[OTPBot Error] Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Set up auto-clear functionality
     */
    setupAutoClear() {
        // Clear OTPs older than 1 hour
        setInterval(async () => {
            try {
                const oneHourAgo = new Date(Date.now() - 3600000);
                this.otpList = this.otpList.filter(item => 
                    new Date(item.timestamp) > oneHourAgo
                );
                await chrome.storage.local.set({ otpList: this.otpList });
            } catch (error) {
                console.error('[OTPBot Error] Auto-clear failed:', error);
            }
        }, 300000); // Check every 5 minutes
    }

    /**
     * Enforce strict Content Security Policy
     */
    enforceStrictCSP() {
        chrome.webRequest.onHeadersReceived.addListener(
            (details) => {
                const headers = details.responseHeaders || [];
                let cspHeader = headers.find(h => 
                    h.name.toLowerCase() === 'content-security-policy'
                );

                if (cspHeader) {
                    cspHeader.value += "; script-src-elem 'none'";
                } else {
                    headers.push({
                        name: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src-elem 'none'"
                    });
                }

                return { responseHeaders: headers };
            },
            { urls: ['<all_urls>'] },
            ['blocking', 'responseHeaders']
        );
    }

    /**
     * Clear all stored OTPs
     */
    async clearOTPs() {
        try {
            this.otpList = [];
            await chrome.storage.local.set({ otpList: [] });
        } catch (error) {
            console.error('[OTPBot Error] Failed to clear OTPs:', error);
            throw error;
        }
    }
}

// Initialize the OTP manager
const manager = new OTPManager();
manager.init();