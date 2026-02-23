export const brand = {
  name: "FreshMooz",
  primary: "#e91e63",
  secondary: "#111827"
};

export const apiConfig = (base?: string) => ({
  apiBase: base || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5079"
});
