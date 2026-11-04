// Facts about the site that several pages and components repeat.
export const EMAIL = "me@feleuxens.de";

export const LANES = [
  { n: 1, title: "IT Services", href: "/tech-services" },
  { n: 2, title: "Music", href: "/music" },
  { n: 3, title: "Photography", href: "/photography" },
] as const;

export const SOCIAL = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/felixgrueb/" },
  { name: "GitHub", href: "https://github.com/Feleuxens" },
  { name: "Instagram", href: "https://instagram.com/Feleuxens" },
] as const;
