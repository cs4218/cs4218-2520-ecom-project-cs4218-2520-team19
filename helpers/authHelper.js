import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    try {
        if (!password || typeof password !== 'string') {
            throw new Error('Empty password given');
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;

    } catch (error) {
        console.log(error);
        throw error
    }
};

export const comparePassword = async (password,hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
}