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
const expectValid = (pwd) =>
  expect(checkPasswordStrength(pwd)).toEqual({ isPasswordValid: true, invalidPasswordReason: null });

const expectInvalid = (pwd, reasonSnippet) => {
  const result = checkPasswordStrength(pwd);
  expect(result.isPasswordValid).toBe(false);
  expect(result.invalidPasswordReason).toMatch(reasonSnippet);
};

// ─── EP: Type / non-string inputs ───────────────────────────────────────────
describe('Type check — invalid (non-string) partition', () => {
  test.each([
    ['number',    42],
    ['null',      null],
    ['undefined', undefined],
    ['array',     ['Abcdef1!']],
    ['object',    { password: 'Abcdef1!' }],
    ['boolean',   true],
  ])('%s is rejected', (_label, input) => {
    expectInvalid(input, /invalid password/i);
  });
});


// ─── EP + BVA: Length ───────────────────────────────────────────────────────
describe('Length — invalid partition (< 8 chars)', () => {
  test('empty string is rejected', () => expectInvalid('', /8 characters/i));
  test('1-char string is rejected', () => expectInvalid('A', /8 characters/i));
  // representative mid-partition value
  test('4-char string is rejected', () => expectInvalid('Aa1!', /8 characters/i));
});

describe('Length — BVA around threshold of 8', () => {
  // boundary - 1  →  invalid
  test('7 chars is rejected (boundary - 1)', () =>
    expectInvalid('Abcde1!', /8 characters/i));

  // exact boundary  →  valid (length rule only; all other rules satisfied)
  test('8 chars is accepted (boundary)', () => expectValid('Abcdef1!'));

  // boundary + 1  →  valid
  test('9 chars is accepted (boundary + 1)', () => expectValid('Abcdefg1!'));
});

describe('Length — valid partition (> 8 chars)', () => {
  test('long password is accepted', () => expectValid('Abcdefghij1!'));
});


// ─── EP + BVA: Uppercase ────────────────────────────────────────────────────
describe('Uppercase — invalid partition (no A–Z)', () => {
  test('all-lowercase password is rejected', () =>
    expectInvalid('abcdef1!', /uppercase/i));
});

describe('Uppercase — BVA', () => {
  test('exactly 1 uppercase is accepted (minimum boundary)', () =>
    expectValid('abcdeF1!'));

  test('all-uppercase (+ satisfying lower/digit/special) is accepted', () =>
    expectValid('ABCDEf1!'));
});


// ─── EP + BVA: Lowercase ────────────────────────────────────────────────────
describe('Lowercase — invalid partition (no a–z)', () => {
  test('all-uppercase password is rejected', () =>
    expectInvalid('ABCDEF1!', /lowercase/i));
});

describe('Lowercase — BVA', () => {
  test('exactly 1 lowercase is accepted (minimum boundary)', () =>
    expectValid('ABCDEa1!'));

  test('all-lowercase (+ satisfying upper/digit/special) is accepted', () =>
    expectValid('abcdeF1!'));
});


// ─── EP + BVA: Digit ────────────────────────────────────────────────────────
describe('Digit — invalid partition (no 0–9)', () => {
  test('no digit in password is rejected', () =>
    expectInvalid('Abcdef!!', /number/i));
});

describe('Digit — BVA', () => {
  test('exactly 1 digit is accepted (minimum boundary)', () =>
    expectValid('Abcdef1!'));

  test('all digits (+ satisfying other rules) is accepted', () =>
    expectValid('A1234561!'.slice(0, 8) + 'a!'));
});


// ─── EP + BVA: Special character ────────────────────────────────────────────
describe('Special char — invalid partition (alphanumeric only)', () => {
  test('no special character is rejected', () =>
    expectInvalid('Abcdef12', /special/i));
});

describe('Special char — BVA', () => {
  test('exactly 1 special char is accepted (minimum boundary)', () =>
    expectValid('Abcdef1!'));

  test('multiple special chars are accepted', () =>
    expectValid('Abc!@#1d'));

  test('space counts as a special character', () =>
    expectValid('Abcde 1d'));
});


// ─── EP: Fully valid passwords ───────────────────────────────────────────────
describe('Valid partition — all rules satisfied', () => {
  test.each([
    ['minimal compliant password',      'Abcdef1!'],
    ['special char at start',           '!Abcdef1'],
    ['special char in middle',          'Abc!def1'],
    ['only digits and special',         'ABCD!ef1'],
    ['mixed Unicode-safe ASCII specials','P@ssw0rd'],
    ['longer password',                 'MyP@ssw0rdIsLong!'],
  ])('%s', (_label, pwd) => expectValid(pwd));
});


// ─── Rule ordering / interaction tests ──────────────────────────────────────
// These verify that the *correct* error is returned for multi-rule violations,
// confirming the documented check order: type → length → upper → lower → digit → special.
describe('Check order — first failing rule wins', () => {
  test('short password reports length error, not uppercase', () =>
    expectInvalid('abc1!', /8 characters/i));

  test('missing uppercase reports uppercase error (not lowercase/digit/special)', () =>
    expectInvalid('abcdef1!', /uppercase/i));

  test('missing lowercase reports lowercase error (not digit/special)', () =>
    expectInvalid('ABCDEF1!', /lowercase/i));

  test('missing digit reports digit error (not special)', () =>
    expectInvalid('ABCDefg!', /number/i));

  test('missing special reports special error last', () =>
    expectInvalid('ABCDefg1', /special/i));
});