import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { rateLimit } from 'express-rate-limit'

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const decode = JWT.verify(
            req.headers.authorization,
            process.env.JWT_SECRET
        );
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in require sign in middleware",
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if(user.role !== 1) {
            return res.status(401).send({
                success: false,
                message: "UnAuthorized Access",
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in admin middleware",
        });
    }
};

export const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes 
	limit: 3, // Limit each IP to 3 requests per `window` (here, per 1 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    message: { message: 'Too many requests, please try again later.' },
    skipSuccessfulRequests: true, // Only count failed requests (invalid password) towards the rate limit
    requestWasSuccessful: (req, res) => {
        // only count requests that result in a 401 (invalid password) as failed attempts
        return res.statusCode != 401; 
    },
    validate: {xForwardedForHeader: false},
});