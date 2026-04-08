// Teo Kim Han, A0273551E
// Used AI to generate ideas for testing hashPassword
import { hashPassword, comparePassword, checkPasswordStrength } from './authHelper';
import bcrypt from 'bcrypt';

describe('hashPassword tests', () => {
    const password = 'password123';
    const invalidPasswords = [
        ['empty string', ''],
        ['number', 123],
        ['null', null],
        ['undefined', undefined],
        ['object', {pw: 'password123'}],
        ['array', ['pw', 'password123']],
        ['boolean', true],
        ['function', () => 'password123'],
    ];

    beforeEach(() => {
        // to prevent console from being flooded with logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should hash a password properly', async () => {
        const hashedPassword = await hashPassword(password);
        const isSame = await bcrypt.compare(password, hashedPassword);

        expect(hashedPassword).not.toEqual(password);
        expect(hashedPassword).toEqual(expect.any(String));
        expect(isSame).toBe(true);
    });

    it('should not generate the same hash twice for the same password', async () => {
        const hashedPassword1 = await hashPassword(password);
        const hashedPassword2 = await hashPassword(password);
        
        expect(hashedPassword1).not.toEqual(hashedPassword2);
    });

    it.each(invalidPasswords)(
        'should throw an error when given invalid password of type %s',
        async (_, pw) => {
            await expect(hashPassword(pw)).rejects.toThrow();
        }
    );
});

describe('comparePassword tests', () => {
    const pw = 'password123';

    it('should successfully compare a password to its hash', async () => {
        const hashedPassword = await hashPassword(pw);

        await expect(comparePassword(pw, hashedPassword)).resolves.toBe(true);
    });

    it('should return false when comparing a password with a hash not generated from it', async () => {
        const hashedPassword = await hashPassword('randomPassword123');

        await expect(comparePassword(pw, hashedPassword)).resolves.toBe(false);
    });

    it('throws error when given null password or hash', async () => {
        const hashedPassword = await hashPassword(pw);

        await expect(comparePassword(null, hashedPassword)).rejects.toThrow();
        await expect(comparePassword(pw, null)).rejects.toThrow();
        await expect(comparePassword(null, null)).rejects.toThrow();
    });

    it('throws error when given undefined password or hash', async () => {
        const hashedPassword = await hashPassword(pw);

        await expect(comparePassword(undefined, hashedPassword)).rejects.toThrow();
        await expect(comparePassword(pw, undefined)).rejects.toThrow();
        await expect(comparePassword(undefined, undefined)).rejects.toThrow();
    });
});

// Teo Kim Han (A0273551E), MS3-Security Testing
describe("checkPasswordStrength", () => {
        const weakPasswords = [
        'Ab1!',              // boundary: exactly 7 chars (one below minimum)
        'alllowercase1!',    // missing uppercase
        'ALLUPPERCASE1!',    // missing lowercase
        'NoSpecialChars1',   // missing special char
        'NoDigitsHere!',     // missing digit
    ];

    it("valid password passes all checks", () => {
        expect(checkPasswordStrength("Abcdefg1!")).toEqual({ isPasswordValid: true, invalidPasswordReason: null });
    });

    it("accepts various special characters", () => {
        const specials = ["@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "+", "="];
        specials.forEach((char) => {
        expect(checkPasswordStrength(`Abcdefg1${char}`)).toEqual({ isPasswordValid: true, invalidPasswordReason: null });
        });
    });
    
    it("passes at exactly 8 characters with all requirements met", () => {
        expect(checkPasswordStrength("Abcde1!x")).toEqual({ isPasswordValid: true, invalidPasswordReason: null });
    });

    it("fails empty string", () => {
        expect(checkPasswordStrength("")).toEqual({
        isPasswordValid: false,
        invalidPasswordReason: "Password must be at least 8 characters.",
        });
    });

    it("fails for invalid password type", () => {
        expect(checkPasswordStrength(null)).toEqual({
        isPasswordValid: false,
        invalidPasswordReason: "Invalid password: must be a non-empty string.",
        });
        expect(checkPasswordStrength(undefined)).toEqual({
        isPasswordValid: false,
        invalidPasswordReason: "Invalid password: must be a non-empty string.",
        });
    });

    it.each(weakPasswords)(
        "fails weak password: %s",
        (pw) => {
            const result = checkPasswordStrength(pw);
            expect(result.isPasswordValid).toBe(false);
            expect(result.invalidPasswordReason).toBeTruthy();
        }
    );
});