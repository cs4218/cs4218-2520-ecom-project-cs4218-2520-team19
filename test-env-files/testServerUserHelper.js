//Varatharaju Mithuna, A0281223N
import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";

export async function seedPlaywrightUser() {
    const user = await userModel.findOne({ email: "uitest@email.com" });
    if (user) return;

    const hashedPassword = await hashPassword("password123");
    await userModel.create({
        name: "uitest",
        email: "uitest@email.com",
        password: hashedPassword,
        phone: "123456789",
        address: "uitest address",
        answer: "tennis",
        role: 0 // normal user
    });
}