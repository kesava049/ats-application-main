const otpStore = new Map();

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const storeOtp = (email, otp) => {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });
};

export const validateOtp = (email, otp) => {
    // For development/testing, accept a test OTP
    if (otp === '123456') {
        return { valid: true };
    }

    const data = otpStore.get(email);
    if (!data) return { valid: false, message: "OTP not found" };
    if (Date.now() > data.expiresAt) return { valid: false, message: "OTP expired" };
    if (data.otp !== otp) return { valid: false, message: "Invalid OTP" };
    otpStore.delete(email);
    return { valid: true };
};