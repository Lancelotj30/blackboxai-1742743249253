// OTPBot Utility Functions

/**
 * Returns a regular expression for matching OTP patterns
 * Matches 4-6 digit numbers that commonly represent OTPs
 */
function getOTPRegex() {
    return /\b\d{4,6}\b/g;
}

/**
 * Validates if a string matches OTP format requirements
 * @param {string} otp - The potential OTP string to validate
 * @returns {boolean} - True if valid OTP format, false otherwise
 */
function isValidOTP(otp) {
    if (!otp || typeof otp !== 'string') {
        return false;
    }
    
    // Check if it's a 4-6 digit number
    return /^\d{4,6}$/.test(otp);
}

/**
 * Standardized error logging function
 * @param {Error|string} error - The error object or message
 * @param {string} context - Additional context about where the error occurred
 */
function logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;
    
    console.error(`[OTPBot Error] ${timestamp}
    Context: ${context}
    Message: ${errorMessage}
    ${error instanceof Error ? `Stack: ${error.stack}` : ''}`);
}

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other files
export {
    getOTPRegex,
    isValidOTP,
    logError,
    debounce
};