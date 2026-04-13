import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  try {
    if (!password || typeof password !== "string") {
      throw new Error("Invalid password: must be a non-empty string");
    }
    const saltRounds = 8;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const checkPasswordStrength = (password) => {
  if (typeof password !== "string") {
    return {
      isPasswordValid: false,
      invalidPasswordReason: "Invalid password: must be a non-empty string.",
    };
  }
  // At least 8 characters
  if (password.length < 8) {
    return {
      isPasswordValid: false,
      invalidPasswordReason: "Password must be at least 8 characters.",
    };
  }

  // At least 1 uppercase
  if (!/[A-Z]/.test(password)) {
    return {
      isPasswordValid: false,
      invalidPasswordReason:
        "Password must contain at least 1 uppercase letter.",
    };
  }

  // At least 1 lowercase
  if (!/[a-z]/.test(password)) {
    return {
      isPasswordValid: false,
      invalidPasswordReason:
        "Password must contain at least 1 lowercase letter.",
    };
  }

  // At least 1 number
  if (!/[0-9]/.test(password)) {
    return {
      isPasswordValid: false,
      invalidPasswordReason: "Password must contain at least 1 number.",
    };
  }

  // At least 1 special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isPasswordValid: false,
      invalidPasswordReason:
        "Password must contain at least 1 special character.",
    };
  }

  return { isPasswordValid: true, invalidPasswordReason: null };
};
