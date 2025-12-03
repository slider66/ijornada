/**
 * Generates a random EAN-13 barcode.
 * The first 12 digits are random, and the 13th is the checksum.
 */
export function generateEAN13(): string {
    let code = ""
    // Generate first 12 digits
    for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10)
    }

    // Calculate checksum
    const checksum = calculateEAN13Checksum(code)
    return code + checksum
}

/**
 * Calculates the checksum digit for an EAN-13 code (first 12 digits).
 */
export function calculateEAN13Checksum(code: string): number {
    if (code.length !== 12) {
        throw new Error("Input must be 12 digits long")
    }

    let sum = 0
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code[i])
        // Odd positions (0-indexed) multiply by 1, Even positions multiply by 3
        // In EAN-13 standard (1-indexed): Odd * 1, Even * 3. 
        // But since we process 12 digits, index 0 is position 1 (Odd).
        // Wait, standard says: 
        // "The checksum is calculated by summing the odd position numbers (1, 3, 5, etc.) multiplied by 1 and the even position numbers (2, 4, 6, etc.) multiplied by 3."
        // Let's verify. 
        // Example: 400638133393x
        // Positions:
        // 1(4)*1 + 2(0)*3 + 3(0)*1 + 4(6)*3 + 5(3)*1 + 6(8)*3 + 7(1)*1 + 8(3)*3 + 9(3)*1 + 10(3)*3 + 11(9)*1 + 12(3)*3
        // 4 + 0 + 0 + 18 + 3 + 24 + 1 + 9 + 3 + 9 + 9 + 9 = 89
        // Nearest multiple of 10 >= 89 is 90. Checksum = 90 - 89 = 1.

        // My loop i=0 is position 1 (Odd).
        if (i % 2 === 0) {
            sum += digit * 1
        } else {
            sum += digit * 3
        }
    }

    const nearestMultipleOf10 = Math.ceil(sum / 10) * 10
    return nearestMultipleOf10 - sum
}
