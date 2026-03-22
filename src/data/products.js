// data/products.js — SkoolPocket Canteen Menu v4
// ════════════════════════════════════════════════
// Shape: { id, name, price, category, image, tag, description, popular, calories }
// category: "food" | "drink"
// popular: true = appears in the "Top Picks" hero strip

var PRODUCTS = [

  // ─── 🍔 FOOD ───────────────────────────────────────────────

  {
    id: "p-001",
    name: "Jollof Rice + Chicken",
    price: 650,
    category: "food",
    tag: "🔥 Most Popular",
    description: "Smoky party jollof with a juicy chicken piece",
    popular: true,
    calories: "~620 kcal",
    image: "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-002",
    name: "Fried Rice + Turkey",
    price: 800,
    category: "food",
    tag: "⭐ Staff Pick",
    description: "Mixed fried rice with a generous turkey cut",
    popular: true,
    calories: "~700 kcal",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-003",
    name: "White Rice + Stew",
    price: 550,
    category: "food",
    tag: "",
    description: "Fluffy white rice with rich tomato beef stew",
    popular: false,
    calories: "~580 kcal",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-004",
    name: "Indomie + Egg",
    price: 350,
    category: "food",
    tag: "⚡ Quick Bite",
    description: "Spicy noodles stir-fried with a whole egg",
    popular: true,
    calories: "~430 kcal",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-005",
    name: "Meat Pie",
    price: 250,
    category: "food",
    tag: "",
    description: "Flaky golden-baked Nigerian meat pie",
    popular: false,
    calories: "~320 kcal",
    image: "https://images.unsplash.com/photo-1574691250077-03a929faece5?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-006",
    name: "Sausage Roll",
    price: 200,
    category: "food",
    tag: "💰 Budget",
    description: "Classic sausage roll — the canteen staple",
    popular: false,
    calories: "~280 kcal",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-007",
    name: "Puff Puff",
    price: 150,
    category: "food",
    tag: "🍩 Sweet",
    description: "Freshly fried Nigerian puff puff — warm & fluffy",
    popular: true,
    calories: "~210 kcal",
    image: "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-008",
    name: "Snack Combo Pack",
    price: 400,
    category: "food",
    tag: "🎁 Value Deal",
    description: "Biscuits + groundnut + a sweet — best value",
    popular: false,
    calories: "~380 kcal",
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-009",
    name: "Egg Sandwich",
    price: 300,
    category: "food",
    tag: "🥚 Fresh",
    description: "Toasted bread with boiled egg and mayo",
    popular: false,
    calories: "~340 kcal",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80&auto=format&fit=crop"
  },

  // ─── 🥤 DRINKS ─────────────────────────────────────────────

  {
    id: "p-010",
    name: "Bottled Water",
    price: 100,
    category: "drink",
    tag: "💧 Essential",
    description: "500ml chilled pure table water",
    popular: false,
    calories: "0 kcal",
    image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-011",
    name: "Chivita Juice",
    price: 200,
    category: "drink",
    tag: "🧃 Fruity",
    description: "Mixed tropical fruit juice pack",
    popular: true,
    calories: "~140 kcal",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-012",
    name: "Zobo Drink",
    price: 150,
    category: "drink",
    tag: "❤️ Local Fave",
    description: "Cold hibiscus zobo — sweet, tangy & refreshing",
    popular: true,
    calories: "~80 kcal",
    image: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-013",
    name: "Coca-Cola (50cl)",
    price: 300,
    category: "drink",
    tag: "🥤 Ice Cold",
    description: "Ice-cold 50cl Coca-Cola bottle",
    popular: true,
    calories: "~210 kcal",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-014",
    name: "Milo (Hot/Cold)",
    price: 250,
    category: "drink",
    tag: "☕ Energy",
    description: "Milo chocolate malt — served hot or cold",
    popular: false,
    calories: "~190 kcal",
    image: "https://images.unsplash.com/photo-1481671703460-040cb8a2d909?w=400&q=80&auto=format&fit=crop"
  },
  {
    id: "p-015",
    name: "Kunu Drink",
    price: 200,
    category: "drink",
    tag: "🌾 Traditional",
    description: "Cold Northern millet drink — creamy & smooth",
    popular: false,
    calories: "~120 kcal",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80&auto=format&fit=crop"
  }

];