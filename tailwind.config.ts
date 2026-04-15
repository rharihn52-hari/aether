import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { fontFamily: { display: ['"Sora"', "system-ui"], body: ['"Nunito Sans"', "system-ui"], mono: ['"Fira Code"', "monospace"] } } },
  plugins: [],
};
export default config;
