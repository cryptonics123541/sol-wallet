// Create this file at: utils/random.js
export const cryptoRandom = () => {
    // Use crypto.getRandomValues() for more secure random numbers
    // Fallback to Math.random() if crypto is not available
    if (typeof window !== 'undefined' && window.crypto) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }
    return Math.random();
};