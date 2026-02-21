// Teo Kim Han, A0273551E
// Used AI to generate ideas for testing hashPassword
import { hashPassword, comparePassword } from './authHelper';
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

    it('should hash a password properly', async () => {
        const hashedPassword = await hashPassword(password);
        const isSame = await bcrypt.compare(password, hashedPassword);

        expect(hashedPassword).not.toEqual(password);
        expect(hashedPassword).toEqual(expect.any(String));
        expect(isSame).toBe(true);
    });

    it('should not generate the same hash twice', async () => {
        const hashedPassword1 = await hashPassword(password);
        const hashedPassword2 = await hashPassword(password);
        
        expect(hashedPassword1).not.toEqual(hashedPassword2);
    });

    it.each(invalidPasswords)(
        'should throw an error when given invalid password of type %s',
        async (_, pw) => {
            console.log = jest.fn();

            await expect(hashPassword(pw)).rejects.toThrow();
            expect(console.log).toHaveBeenCalled();
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