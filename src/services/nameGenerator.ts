import { getNickname, saveNickname } from "@/services/database";

const CHARACTERS = [
  // Male
  "Naruto", "Goku", "Luffy", "Ichigo", "Levi", "Sasuke", "Vegeta",
  "Zoro", "Tanjiro", "Gon", "Killua", "Eren", "Deku", "Todoroki",
  "Kakashi", "Itachi", "Saitama", "Genos", "Natsu", "Gray", "Inuyasha",
  "Edward", "Lelouch", "Light", "Spike", "Gintoki", "Meliodas", "Ban",
  "Kaneki", "Asta", "Yuno", "Senku", "Yuji", "Megumi", "Gojo",
  "Nanami", "Kenshin", "Yusuke", "Hiei", "Kurama", "Gaara", "Shikamaru",
  "Kiba", "Neji", "Rock", "Gohan", "Trunks", "Piccolo", "Krillin",
  "Sanji", "Usopp", "Franky", "Brook", "Shanks", "Ace", "Law",
  "Zenitsu", "Inosuke", "Giyu", "Rengoku", "Tengen", "Muichiro",
  "Aang", "Archer", "Shirou", "Guts", "Griffith", "Thorfinn", "Canute",
  "Subaru", "Kazuma", "Ainz", "Bell", "Kirito", "Klein", "Soma",
  "Takumi", "Karma", "Nagisa", "Hisoka", "Chrollo", "Ging", "Kurapika",
  "Mob", "Reigen", "Loid", "Denji", "Aki", "Power", "Ryuk",
  "Mugen", "Jin", "Kamina", "Simon", "Vash", "Jet",
  "Roy", "Alphonse", "Scar", "Ling",
  // Female
  "Sakura", "Mikasa", "Nezuko", "Anya", "Rem", "Hinata", "Asuna",
  "Nami", "Robin", "Erza", "Lucy", "Megumin", "Aqua", "Emilia",
  "Raphtalia", "Zero", "Violet", "Chika", "Kaguya", "Mitsuri",
  "Shinobu", "Yor", "Makima", "Nobara", "Mai", "Maki", "Nico",
  "Rukia", "Orihime", "Yoruichi", "Winry", "Riza", "Saber", "Rin",
  "Tohru", "Kanna", "Elma", "Ochaco", "Momo", "Tsuyu", "Jiro",
  "Toga", "Esdeath", "Akame", "Mine", "Bulma", "Videl",
  "Mirajane", "Juvia", "Wendy", "Levy", "Merlin", "Diane", "Elizabeth",
  "Touka", "Hange", "Historia", "Ymir", "Annie", "Sasha", "Petra",
  "Tsunade", "Ino", "Temari", "Tenten", "Konan", "Kushina",
  "Usagi", "Rei", "Ami", "Minako", "Makoto", "Kagome", "Sango",
  "Celty", "Shiro", "Yoko", "Nia", "Holo", "Taiga", "Misaka",
  "Kurisu", "Homura", "Madoka", "Sayaka", "Mami", "Kyoko",
  "Nana", "Faye", "Revy", "Balsa", "Jolyne", "Utena",
  "Ryuko", "Satsuki", "Maka", "Olivier", "Izumi",
];

const ADJECTIVES = [
  "Dazzling", "Mighty", "Cosmic", "Sneaky", "Legendary", "Turbo", "Epic",
  "Radiant", "Fearless", "Sparkling", "Blazing", "Mystic", "Thunderous",
  "Stellar", "Groovy", "Zippy", "Noble", "Swift", "Jolly", "Vivid",
  "Brave", "Clever", "Daring", "Fierce", "Gentle", "Hyper", "Keen",
  "Lucky", "Nimble", "Plucky", "Quick", "Rowdy", "Shiny", "Tough",
  "Ultra", "Wild", "Zany", "Bold", "Chill", "Funky", "Gritty",
  "Happy", "Icy", "Jazzy", "Kooky", "Lofty", "Merry", "Nifty",
  "Peppy", "Royal", "Snappy", "Witty", "Atomic", "Breezy",
  "Crispy", "Dreamy", "Flashy", "Grand", "Stormy", "Frosty",
  "Golden", "Silver", "Phantom", "Shadow", "Solar", "Lunar",
  "Crimson", "Azure", "Amber", "Jade", "Rustic", "Pixel",
  "Neon", "Sonic", "Primal", "Rogue", "Savage",
  "Silent", "Wicked", "Chaos", "Eternal", "Arcane", "Rusty",
  "Humble", "Spicy", "Salty", "Toasty", "Wobbly", "Bubbly",
  "Fluffy", "Dizzy", "Fuzzy", "Quirky", "Perky", "Sassy",
  "Cheeky", "Twisted", "Wacky", "Bouncy", "Scrappy", "Gutsy",
  "Crafty", "Slick", "Sharp", "Grim", "Dusty", "Misty",
  "Spooky", "Ghostly", "Blazed", "Charged", "Wired", "Hyped",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getOrCreateNickname(barcode: string): string {
  const existing = getNickname(barcode);
  if (existing) return existing;

  const name = `${pickRandom(ADJECTIVES)} ${pickRandom(CHARACTERS)}`;
  saveNickname(barcode, name);
  return name;
}
