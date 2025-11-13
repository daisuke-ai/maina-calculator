// config/agents.ts

export const AGENTS = [
  { id: 1, realName: "Ammar", aliasName: "Ammar", email: "ammar@miana.com.co" },
  { id: 2, realName: "Ayesha", aliasName: "Ada", email: "ada@miana.com.co" },
  { id: 3, realName: "Eman", aliasName: "Elif", email: "elif@miana.com.co" },
  { id: 4, realName: "Momina", aliasName: "Aylin", email: "aylin@miana.com.co" },
  { id: 5, realName: "Farhat", aliasName: "Farhat", email: "farhat@miana.com.co" },
  { id: 6, realName: "Maasomah", aliasName: "Lina", email: "lina@miana.com.co" },
  { id: 7, realName: "Faizan", aliasName: "Fazil", email: "fazil@miana.com.co" },
  { id: 8, realName: "Mahrukh", aliasName: "Mina", email: "mina@miana.com.co" },
  { id: 9, realName: "Awais", aliasName: "Ozan", email: "ozan@miana.com.co" },
  { id: 10, realName: "Tayyab", aliasName: "Burakh", email: "burakh@miana.com.co" },
  { id: 11, realName: "Abdullah", aliasName: "Noyaan", email: "noyaan@miana.com.co" },
  { id: 12, realName: "Amir", aliasName: "Emir", email: "emir@miana.com.co" },
  { id: 13, realName: "Sadia", aliasName: "Sara", email: "sara@miana.com.co" },
  { id: 14, realName: "Asif", aliasName: "Mehmet", email: "mehmet@miana.com.co" },
  { id: 15, realName: "Talha", aliasName: "Tabeeb", email: "tabeeb@miana.com.co" },
  { id: 16, realName: "Fatima", aliasName: "Eleena", email: "eleena@miana.com.co" },
  { id: 17, realName: "Rameen", aliasName: "Ayla", email: "ayla@miana.com.co" },
  { id: 18, realName: "Ahmed", aliasName: "Arda", email: "arda@miana.com.co" },
  { id: 19, realName: "Hannan", aliasName: "Hannan", email: "hannan@miana.com.co" },
  { id: 20, realName: "Mishaal", aliasName: "Anna", email: "anna@miana.com.co" },
  { id: 21, realName: "Laiba", aliasName: "Eda", email: "eda@miana.com.co" },
  { id: 22, realName: "Team A", aliasName: "Team A", email: "vanguardhorizon.reit-a@miana.com.co" },
  { id: 23, realName: "Team B", aliasName: "Team B", email: "vanguardhorizon.reit-b@miana.com.co" },
  { id: 24, realName: "Team C", aliasName: "Team C", email: "vanguardhorizon.reit-c@miana.com.co" },
] as const;

export type Agent = typeof AGENTS[number];
