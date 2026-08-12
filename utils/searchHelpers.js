export const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const containsRegex = (value) => ({
    $regex: escapeRegex(String(value).trim()),
    $options: "i",
});

export const exactRegex = (value) => ({
    $regex: `^${escapeRegex(String(value).trim())}$`,
    $options: "i",
});
