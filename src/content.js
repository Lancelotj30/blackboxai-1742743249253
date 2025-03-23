// OTPBot Content Script
import { getOTPRegex, isValidOTP, logError, debounce } from './utils.js';

class OTPScanner {
    constructor() {
        this.previousOTPs = new Set();
        this.observer = null;
        this.scanning = false;
    }

    /**
     * Initialize the OTP scanner
     */
    init() {
        try {
            this.setupMutationObserver();
            this.scanPage();
        } catch (error) {
            logError(error, 'OTPScanner initialization failed');
        }
    }

    /**
     * Set up the mutation observer to watch for DOM changes
     */
    setupMutationObserver() {
        const observerCallback = debounce((mutations) => {
            this.scanPage();
        }, 500);

        this.observer = new MutationObserver(observerCallback);
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Scan the page for OTP patterns
     */
    scanPage() {
        if (this.scanning) return;
        this.scanning = true;

        try {
            const textContent = document.body.innerText;
            const otpRegex = getOTPRegex();
            const matches = textContent.match(otpRegex) || [];

            matches.forEach(potentialOTP => {
                if (isValidOTP(potentialOTP) && !this.previousOTPs.has(potentialOTP)) {
                    this.handleNewOTP(potentialOTP);
                    this.previousOTPs.add(potentialOTP);
                }
            });
        } catch (error) {
            logError(error, 'Error during page scan');
        } finally {
            this.scanning = false;
        }
    }

    /**
     * Handle a newly detected OTP
     * @param {string} otp - The detected OTP
     */
    async handleNewOTP(otp) {
        try {
            await chrome.runtime.sendMessage({
                type: 'OTP_DETECTED',
                otp: otp,
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logError(error, `Failed to send OTP: ${otp}`);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.previousOTPs.clear();
    }
}

// Initialize the scanner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const scanner = new OTPScanner();
    scanner.init();
});