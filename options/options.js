// OTPBot Options Script

class OTPBotOptions {
    constructor() {
        this.form = document.getElementById('settingsForm');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Default settings
        this.defaultSettings = {
            enableAutoCapture: true,
            enableNotifications: true,
            enableEnhancedSecurity: true,
            enableAutoClear: false,
            customPattern: '\\d{4,6}'
        };

        // Input elements
        this.inputs = {
            enableAutoCapture: document.getElementById('enableAutoCapture'),
            enableNotifications: document.getElementById('enableNotifications'),
            enableEnhancedSecurity: document.getElementById('enableEnhancedSecurity'),
            enableAutoClear: document.getElementById('enableAutoClear'),
            customPattern: document.getElementById('customPattern')
        };
    }

    /**
     * Initialize the options page
     */
    async init() {
        try {
            await this.loadSettings();
            this.setupEventListeners();
        } catch (error) {
            console.error('[OTPBot Error] Options initialization failed:', error);
            this.showToast('Failed to load settings', 'error');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation for custom pattern
        this.inputs.customPattern.addEventListener('input', (e) => {
            this.validateCustomPattern(e.target.value);
        });

        // Auto-save on toggle changes
        Object.keys(this.inputs).forEach(key => {
            const input = this.inputs[key];
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => this.handleSettingChange());
            }
        });
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get('settings');
            const settings = { ...this.defaultSettings, ...data.settings };

            // Update form fields
            Object.keys(this.inputs).forEach(key => {
                const input = this.inputs[key];
                if (input.type === 'checkbox') {
                    input.checked = settings[key];
                } else {
                    input.value = settings[key];
                }
            });
        } catch (error) {
            console.error('[OTPBot Error] Failed to load settings:', error);
            throw error;
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        await this.saveSettings();
    }

    /**
     * Handle individual setting changes
     */
    async handleSettingChange() {
        await this.saveSettings();
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            const settings = {
                enableAutoCapture: this.inputs.enableAutoCapture.checked,
                enableNotifications: this.inputs.enableNotifications.checked,
                enableEnhancedSecurity: this.inputs.enableEnhancedSecurity.checked,
                enableAutoClear: this.inputs.enableAutoClear.checked,
                customPattern: this.inputs.customPattern.value
            };

            // Validate custom pattern
            if (!this.validateCustomPattern(settings.customPattern)) {
                return;
            }

            // Save to storage
            await chrome.storage.local.set({ settings });

            // Notify background script
            await chrome.runtime.sendMessage({
                type: 'SETTINGS_UPDATED',
                settings
            });

            this.showToast('Settings saved successfully');
        } catch (error) {
            console.error('[OTPBot Error] Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }

    /**
     * Validate custom regex pattern
     */
    validateCustomPattern(pattern) {
        try {
            // Test if pattern is valid regex
            new RegExp(pattern);
            
            // Remove error styling if exists
            this.inputs.customPattern.classList.remove('border-red-500');
            return true;
        } catch (error) {
            // Add error styling
            this.inputs.customPattern.classList.add('border-red-500');
            this.showToast('Invalid regex pattern', 'error');
            return false;
        }
    }

    /**
     * Show a toast notification
     */
    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        this.toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        } text-white`;
        
        this.toast.style.display = 'block';
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const options = new OTPBotOptions();
    options.init();
});