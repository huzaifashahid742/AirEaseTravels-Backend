const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 5;

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets.entries()) {
        if (now - entry.start > WINDOW_MS) {
            buckets.delete(key);
        }
    }
}, 10 * 60 * 1000);

export const authRateLimit = (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now - entry.start > WINDOW_MS) {
        entry = { start: now, count: 0 };
        buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > MAX) {
        return res.status(429).json({ success: false, message: "Too many requests. Try again later." });
    }
    next();
};
