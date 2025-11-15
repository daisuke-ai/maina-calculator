// config/agents.ts

export const AGENTS = [
  { id: 1, realName: "Ammar", aliasName: "Ammar", email: "ammar@miana.com.co", phone: "(406) 229-9301" },
  { id: 2, realName: "Ayesha", aliasName: "Ada", email: "ada@miana.com.co", phone: "(406) 229-9302" },
  { id: 3, realName: "Eman", aliasName: "Elif", email: "elif@miana.com.co", phone: "(406) 229-9303" },
  { id: 4, realName: "Momina", aliasName: "Aylin", email: "aylin@miana.com.co", phone: "(406) 229-9304" },
  { id: 5, realName: "Farhat", aliasName: "Farhat", email: "farhat@miana.com.co", phone: "(406) 229-9305" },
  { id: 6, realName: "Maasomah", aliasName: "Lina", email: "lina@miana.com.co", phone: "(406) 229-9306" },
  { id: 7, realName: "Faizan", aliasName: "Fazil", email: "fazil@miana.com.co", phone: "(406) 229-9307" },
  { id: 8, realName: "Mahrukh", aliasName: "Mina", email: "mina@miana.com.co", phone: "(406) 229-9308" },
  { id: 9, realName: "Awais", aliasName: "Ozan", email: "ozan@miana.com.co", phone: "(406) 229-9309" },
  { id: 10, realName: "Tayyab", aliasName: "Burakh", email: "burakh@miana.com.co", phone: "(406) 229-9310" },
  { id: 11, realName: "Abdullah", aliasName: "Noyaan", email: "noyaan@miana.com.co", phone: "(406) 229-9311" },
  { id: 12, realName: "Amir", aliasName: "Emir", email: "emir@miana.com.co", phone: "(406) 229-9312" },
  { id: 13, realName: "Sadia", aliasName: "Sara", email: "sara@miana.com.co", phone: "(406) 229-9313" },
  { id: 14, realName: "Asif", aliasName: "Mehmet", email: "mehmet@miana.com.co", phone: "(406) 229-9314" },
  { id: 15, realName: "Talha", aliasName: "Tabeeb", email: "tabeeb@miana.com.co", phone: "(406) 229-9315" },
  { id: 16, realName: "Fatima", aliasName: "Eleena", email: "eleena@miana.com.co", phone: "(406) 229-9316" },
  { id: 17, realName: "Rameen", aliasName: "Ayla", email: "ayla@miana.com.co", phone: "(406) 229-9317" },
  { id: 18, realName: "Ahmed", aliasName: "Arda", email: "arda@miana.com.co", phone: "(406) 229-9318" },
  { id: 19, realName: "Hannan", aliasName: "Hannan", email: "hannan@miana.com.co", phone: "(406) 229-9319" },
  { id: 20, realName: "Mishaal", aliasName: "Anna", email: "anna@miana.com.co", phone: "(406) 229-9320" },
  { id: 21, realName: "Laiba", aliasName: "Eda", email: "eda@miana.com.co", phone: "(406) 229-9321" },
  { id: 22, realName: "Team A", aliasName: "Team A", email: "vanguardhorizon.reit-a@miana.com.co", phone: "(406) 229-9322" },
  { id: 23, realName: "Team B", aliasName: "Team B", email: "vanguardhorizon.reit-b@miana.com.co", phone: "(406) 229-9323" },
  { id: 24, realName: "Team C", aliasName: "Team C", email: "vanguardhorizon.reit-c@miana.com.co", phone: "(406) 229-9324" },
] as const;

export type Agent = typeof AGENTS[number];
