import { sanitize } from "express-xss-sanitizer";

const sanitizeDeep = (value) => {
    if (typeof value === 'string') return sanitize(value);
    if (Array.isArray(value)) return value.map(sanitizeDeep);
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.keys(value).map(key => [key, sanitizeDeep(value[key])])
        );
    }
    return value;
};

// removes potentially harmful strings like <script>alert('123')</script> from request body
export const sanitizeRequestBody = (req, res, next) => {
    if ((req.body && typeof req.body === 'object')) {
        req.body = sanitizeDeep(req.body);
    }
    if ((req.fields && typeof req.fields === 'object')) {
        req.fields = sanitizeDeep(req.fields);
    }
    next();
};