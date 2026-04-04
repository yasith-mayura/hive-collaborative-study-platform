export const PASTEL_COLORS = [
    { bg: "#FFF4CC", text: "#4D3D00", border: "#FFCC00" },
    { bg: "#EAF9EE", text: "#205D3A", border: "#50C793" },
    { bg: "#EAF8FF", text: "#0D4B66", border: "#0CE7FA" },
    { bg: "#FFEFF4", text: "#7A3650", border: "#F68B8D" },
    { bg: "#F1F4F7", text: "#475569", border: "#A0A4A7" },
    { bg: "#F4EEFF", text: "#50337A", border: "#BDA3FF" },
    { bg: "#FFF1E8", text: "#7E4520", border: "#FA916B" },
];

export const getSubjectColor = (subjectCode = "") => {
    const normalized = (subjectCode || "").trim().toUpperCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i += 1) {
        hash = (hash << 5) - hash + normalized.charCodeAt(i);
        hash |= 0;
    }
    return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};
