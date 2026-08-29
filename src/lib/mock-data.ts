// Sample data standing in for the Supabase-backed Luce by Lucia store.

export const BUCKET = "site-images";
export const assetUrl = (file: string) =>
  `https://images.unsplash.com/${IMAGE_MAP[file] ?? IMAGE_MAP.default}?auto=format&fit=crop&w=900&q=70`;

const IMAGE_MAP: Record<string, string> = {
  default: "photo-1490481651871-ab68de25d43d",
  "aura-set-long.webp": "photo-1539008835657-9e8e9680c956",
  "aura-set-long-3.webp": "photo-1483985988355-763728e1935b",
  "aura-set-short-1.webp": "photo-1496747611176-843222e1e57c",
  "signature-1.webp": "photo-1495385794356-15371f348c31",
  "sculpt-jumpsuit.webp": "photo-1485462537746-965f33f7f6a7",
  "everyday-set-short-5.webp": "photo-1441984904996-e0b6ba687e04",
  "everyday-set-long-1.webp": "photo-1487222477894-8943e31ef7b2",
  "zola-1.webp": "photo-1502716119720-b23a93e5fe1b",
  "sahara.webp": "photo-1469334031218-e382a71b716b",
  "after-dark.webp": "photo-1492707892479-7bc8d5a4ee93",
  "brand-story.webp": "photo-1521572163474-6864f9cf17ab",
  "hero.webp": "photo-1529626455594-4ff0802cfb7e",
};

export const KES = (n: number) =>
  `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export type ProductStatus = "Published" | "Draft" | "Archived";

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  image: string;
  category: string;
  collection: string;
  price: number;
  salePrice?: number;
  costPrice: number;
  qty: number;
  lowStock: number;
  status: ProductStatus;
  created: string;
  shortDescription: string;
  description: string;
  tags: string[];
  sizes: string[];
  colors: string[];
};

const p = (
  name: string,
  sku: string,
  image: string,
  category: string,
  collection: string,
  price: number,
  qty: number,
  status: ProductStatus,
  created: string,
  salePrice?: number,
): Product => ({
  id: sku.toLowerCase(),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  sku,
  image,
  category,
  collection,
  price,
  salePrice,
  costPrice: Math.round(price * 0.42),
  qty,
  lowStock: 6,
  status,
  created,
  shortDescription: `${name} — designed and made in Nairobi.`,
  description: `The ${name} is cut from a soft structured blend that drapes cleanly and holds its shape all day. Finished by hand in our Nairobi atelier, it is made to enhance the woman wearing it, never overpower her.`,
  tags: ["nairobi", "ready-to-wear", category.toLowerCase()],
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: ["Black", "Brown", "Cream"],
});

export const products: Product[] = [
  p("Aura Set Long", "LUC-AUR-001", "aura-set-long.webp", "Sets", "New Season", 8900, 24, "Published", "2026-08-02"),
  p("Aura Set Short", "LUC-AUR-002", "aura-set-short-1.webp", "Sets", "New Season", 7600, 4, "Published", "2026-08-05", 6400),
  p("Sculpt Jumpsuit", "LUC-SCU-011", "sculpt-jumpsuit.webp", "Jumpsuits", "Signature Collection", 11200, 12, "Published", "2026-07-21"),
  p("Signature Slip Dress", "LUC-SIG-020", "signature-1.webp", "Dresses", "Signature Collection", 9800, 2, "Published", "2026-07-14"),
  p("Everyday Set Short", "LUC-EVR-031", "everyday-set-short-5.webp", "Lounge", "The Luce Edit", 5400, 38, "Published", "2026-06-30"),
  p("Everyday Set Long", "LUC-EVR-032", "everyday-set-long-1.webp", "Lounge", "The Luce Edit", 6200, 19, "Published", "2026-06-28"),
  p("Zola Occasion Dress", "LUC-ZOL-040", "zola-1.webp", "Occasion Wear", "After Dark", 14500, 7, "Published", "2026-08-18"),
  p("Sahara Wrap Dress", "LUC-SAH-041", "sahara.webp", "Dresses", "New Season", 10400, 0, "Published", "2026-08-20"),
  p("Aura Set Long — Cream", "LUC-AUR-003", "aura-set-long-3.webp", "Sets", "New Season", 8900, 15, "Draft", "2026-08-24"),
  p("Muse Column Dress", "LUC-MUS-050", "signature-1.webp", "Occasion Wear", "After Dark", 16800, 5, "Draft", "2026-08-26"),
  p("Lumière Lounge Robe", "LUC-LUM-060", "everyday-set-long-1.webp", "Lounge", "The Luce Edit", 4900, 42, "Archived", "2026-05-11"),
  p("Nia Tailored Jumpsuit", "LUC-NIA-070", "sculpt-jumpsuit.webp", "Jumpsuits", "New Season", 12600, 9, "Published", "2026-08-12", 10900),
];

export const categories = [
  { id: "c1", name: "Dresses", slug: "dresses", image: "sahara.webp", order: 1, active: true, count: 24, description: "Fluid silhouettes for every hour." },
  { id: "c2", name: "Sets", slug: "sets", image: "aura-set-long.webp", order: 2, active: true, count: 18, description: "Matching two-piece tailoring." },
  { id: "c3", name: "Jumpsuits", slug: "jumpsuits", image: "sculpt-jumpsuit.webp", order: 3, active: true, count: 9, description: "One-and-done dressing." },
  { id: "c4", name: "Lounge", slug: "lounge", image: "everyday-set-short-5.webp", order: 4, active: true, count: 14, description: "Softness for slow mornings." },
  { id: "c5", name: "Occasion Wear", slug: "occasion-wear", image: "zola-1.webp", order: 5, active: true, count: 11, description: "For the evenings that matter." },
  { id: "c6", name: "New Arrivals", slug: "new-arrivals", image: "signature-1.webp", order: 6, active: false, count: 8, description: "The latest into the atelier." },
];

export const collections = [
  { id: "k1", name: "New Season", slug: "new-season", cover: "hero.webp", published: true, featured: true, start: "2026-08-01", end: "2026-10-31", products: 14, description: "The opening chapter of the season — clean tailoring in warm neutrals." },
  { id: "k2", name: "After Dark", slug: "after-dark", cover: "after-dark.webp", published: true, featured: true, start: "2026-07-15", end: "2026-12-31", products: 9, description: "Evening pieces with quiet drama." },
  { id: "k3", name: "The Luce Edit", slug: "the-luce-edit", cover: "everyday-set-long-1.webp", published: true, featured: false, start: "2026-05-01", end: "", products: 21, description: "Everyday essentials, edited down to what you truly wear." },
  { id: "k4", name: "Signature Collection", slug: "signature-collection", cover: "signature-1.webp", published: false, featured: false, start: "2026-09-15", end: "", products: 12, description: "The permanent house pieces." },
];

export type OrderStatus =
  | "Pending" | "Confirmed" | "Processing" | "Ready for delivery"
  | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded" | "Partially refunded";

export type Order = {
  id: string;
  number: string;
  customer: string;
  phone: string;
  email: string;
  total: number;
  delivery: number;
  discount: number;
  payment: PaymentStatus;
  status: OrderStatus;
  fulfilment: string;
  date: string;
  address: string;
  items: { name: string; image: string; variant: string; qty: number; price: number }[];
  notes: string;
};

export const orders: Order[] = [
  {
    id: "1042", number: "LUC-1042", customer: "Amina Wanjiru", phone: "+254 712 445 908", email: "amina.w@gmail.com",
    total: 18400, delivery: 400, discount: 900, payment: "Paid", status: "Processing", fulfilment: "Preparing", date: "2026-08-29",
    address: "Kileleshwa, Othaya Road, Apt 4B, Nairobi",
    items: [
      { name: "Aura Set Long", image: "aura-set-long.webp", variant: "M / Black", qty: 1, price: 8900 },
      { name: "Sculpt Jumpsuit", image: "sculpt-jumpsuit.webp", variant: "S / Cream", qty: 1, price: 11200 },
    ],
    notes: "Customer requested delivery after 5pm.",
  },
  {
    id: "1041", number: "LUC-1041", customer: "Njeri Kamau", phone: "+254 733 210 774", email: "njeri.kamau@outlook.com",
    total: 14900, delivery: 400, discount: 0, payment: "Paid", status: "Shipped", fulfilment: "In transit", date: "2026-08-28",
    address: "Lavington Green, Nairobi",
    items: [{ name: "Zola Occasion Dress", image: "zola-1.webp", variant: "M / Black", qty: 1, price: 14500 }],
    notes: "",
  },
  {
    id: "1040", number: "LUC-1040", customer: "Fatuma Ali", phone: "+254 720 998 112", email: "fatuma.ali@yahoo.com",
    total: 6200, delivery: 650, discount: 650, payment: "Pending", status: "Pending", fulfilment: "Awaiting payment", date: "2026-08-28",
    address: "Nyali, Mombasa",
    items: [{ name: "Everyday Set Long", image: "everyday-set-long-1.webp", variant: "L / Brown", qty: 1, price: 6200 }],
    notes: "M-Pesa STK push resent once.",
  },
  {
    id: "1039", number: "LUC-1039", customer: "Grace Otieno", phone: "+254 701 334 220", email: "grace.o@gmail.com",
    total: 10800, delivery: 400, discount: 0, payment: "Paid", status: "Delivered", fulfilment: "Delivered", date: "2026-08-26",
    address: "Westlands, Nairobi",
    items: [{ name: "Sahara Wrap Dress", image: "sahara.webp", variant: "S / Cream", qty: 1, price: 10400 }],
    notes: "",
  },
  {
    id: "1038", number: "LUC-1038", customer: "Wangari Muthoni", phone: "+254 726 887 001", email: "wangari.m@gmail.com",
    total: 7600, delivery: 500, discount: 1200, payment: "Refunded", status: "Refunded", fulfilment: "Returned", date: "2026-08-24",
    address: "Nakuru CBD, Nakuru",
    items: [{ name: "Aura Set Short", image: "aura-set-short-1.webp", variant: "XS / Black", qty: 1, price: 7600 }],
    notes: "Sizing exchange, refunded on request.",
  },
  {
    id: "1037", number: "LUC-1037", customer: "Sarah Kiptoo", phone: "+254 715 442 330", email: "s.kiptoo@gmail.com",
    total: 22100, delivery: 400, discount: 0, payment: "Paid", status: "Confirmed", fulfilment: "Awaiting pick", date: "2026-08-23",
    address: "Karen, Nairobi",
    items: [
      { name: "Muse Column Dress", image: "signature-1.webp", variant: "M / Black", qty: 1, price: 16800 },
      { name: "Everyday Set Short", image: "everyday-set-short-5.webp", variant: "M / Cream", qty: 1, price: 5400 },
    ],
    notes: "",
  },
  {
    id: "1036", number: "LUC-1036", customer: "Diana Achieng", phone: "+254 799 100 456", email: "diana.achieng@gmail.com",
    total: 5400, delivery: 550, discount: 0, payment: "Failed", status: "Cancelled", fulfilment: "Cancelled", date: "2026-08-22",
    address: "Kisumu Milimani, Kisumu",
    items: [{ name: "Everyday Set Short", image: "everyday-set-short-5.webp", variant: "S / Brown", qty: 1, price: 5400 }],
    notes: "M-Pesa timed out twice.",
  },
  {
    id: "1035", number: "LUC-1035", customer: "Lydia Mwikali", phone: "+254 738 220 118", email: "lydia.mwikali@gmail.com",
    total: 12600, delivery: 400, discount: 1700, payment: "Paid", status: "Ready for delivery", fulfilment: "Packed", date: "2026-08-21",
    address: "Kilimani, Nairobi",
    items: [{ name: "Nia Tailored Jumpsuit", image: "sculpt-jumpsuit.webp", variant: "L / Cream", qty: 1, price: 12600 }],
    notes: "",
  },
];

export const customers = [
  { id: "u1", name: "Amina Wanjiru", email: "amina.w@gmail.com", phone: "+254 712 445 908", orders: 7, spent: 68400, last: "2026-08-29", type: "Account", location: "Nairobi" },
  { id: "u2", name: "Njeri Kamau", email: "njeri.kamau@outlook.com", phone: "+254 733 210 774", orders: 4, spent: 41200, last: "2026-08-28", type: "Guest", location: "Nairobi" },
  { id: "u3", name: "Fatuma Ali", email: "fatuma.ali@yahoo.com", phone: "+254 720 998 112", orders: 2, spent: 12800, last: "2026-08-28", type: "Guest", location: "Mombasa" },
  { id: "u4", name: "Grace Otieno", email: "grace.o@gmail.com", phone: "+254 701 334 220", orders: 6, spent: 55600, last: "2026-08-26", type: "Account", location: "Nairobi" },
  { id: "u5", name: "Wangari Muthoni", email: "wangari.m@gmail.com", phone: "+254 726 887 001", orders: 3, spent: 21400, last: "2026-08-24", type: "Guest", location: "Nakuru" },
  { id: "u6", name: "Sarah Kiptoo", email: "s.kiptoo@gmail.com", phone: "+254 715 442 330", orders: 9, spent: 104300, last: "2026-08-23", type: "Account", location: "Nairobi" },
  { id: "u7", name: "Diana Achieng", email: "diana.achieng@gmail.com", phone: "+254 799 100 456", orders: 1, spent: 5400, last: "2026-08-22", type: "Guest", location: "Kisumu" },
  { id: "u8", name: "Lydia Mwikali", email: "lydia.mwikali@gmail.com", phone: "+254 738 220 118", orders: 5, spent: 47900, last: "2026-08-21", type: "Account", location: "Nairobi" },
];

export const revenueSeries = [
  { day: "Aug 01", revenue: 42000, orders: 5 }, { day: "Aug 04", revenue: 58000, orders: 7 },
  { day: "Aug 07", revenue: 36000, orders: 4 }, { day: "Aug 10", revenue: 74000, orders: 9 },
  { day: "Aug 13", revenue: 61000, orders: 8 }, { day: "Aug 16", revenue: 88000, orders: 11 },
  { day: "Aug 19", revenue: 69000, orders: 8 }, { day: "Aug 22", revenue: 96000, orders: 12 },
  { day: "Aug 25", revenue: 81000, orders: 10 }, { day: "Aug 28", revenue: 118000, orders: 14 },
];

export const categorySales = [
  { name: "Dresses", value: 384000 },
  { name: "Sets", value: 296000 },
  { name: "Occasion Wear", value: 218000 },
  { name: "Jumpsuits", value: 141000 },
  { name: "Lounge", value: 98000 },
];

export const topProducts = [
  { name: "Aura Set Long", image: "aura-set-long.webp", units: 62, revenue: 551800 },
  { name: "Zola Occasion Dress", image: "zola-1.webp", units: 28, revenue: 406000 },
  { name: "Sculpt Jumpsuit", image: "sculpt-jumpsuit.webp", units: 31, revenue: 347200 },
  { name: "Sahara Wrap Dress", image: "sahara.webp", units: 26, revenue: 270400 },
  { name: "Everyday Set Long", image: "everyday-set-long-1.webp", units: 34, revenue: 210800 },
];

export const discounts = [
  { id: "d1", code: "LUCE10", type: "Percentage", value: 10, min: 5000, max: 3000, uses: 84, limit: 300, start: "2026-08-01", end: "2026-09-30", active: true, applies: "All products" },
  { id: "d2", code: "NEWSEASON", type: "Percentage", value: 15, min: 10000, max: 5000, uses: 41, limit: 150, start: "2026-08-10", end: "2026-09-15", active: true, applies: "Collection · New Season" },
  { id: "d3", code: "AFTERDARK", type: "Fixed", value: 2000, min: 15000, max: 2000, uses: 12, limit: 60, start: "2026-08-15", end: "2026-10-01", active: true, applies: "Collection · After Dark" },
  { id: "d4", code: "LOUNGE500", type: "Fixed", value: 500, min: 4000, max: 500, uses: 60, limit: 60, start: "2026-06-01", end: "2026-07-31", active: false, applies: "Category · Lounge" },
];

export const subscribers = [
  { id: "n1", email: "amina.w@gmail.com", name: "Amina Wanjiru", date: "2026-08-12", status: "Subscribed" },
  { id: "n2", email: "njeri.kamau@outlook.com", name: "Njeri Kamau", date: "2026-08-09", status: "Subscribed" },
  { id: "n3", email: "hello@studio-ke.com", name: "", date: "2026-08-04", status: "Subscribed" },
  { id: "n4", email: "fatuma.ali@yahoo.com", name: "Fatuma Ali", date: "2026-07-28", status: "Unsubscribed" },
  { id: "n5", email: "s.kiptoo@gmail.com", name: "Sarah Kiptoo", date: "2026-07-21", status: "Subscribed" },
  { id: "n6", email: "lydia.mwikali@gmail.com", name: "Lydia Mwikali", date: "2026-07-14", status: "Subscribed" },
  { id: "n7", email: "diana.achieng@gmail.com", name: "Diana Achieng", date: "2026-06-30", status: "Unsubscribed" },
];

export const reviews = [
  { id: "r1", customer: "Amina Wanjiru", location: "Nairobi", product: "Aura Set Long", rating: 5, text: "The fit is impeccable. It feels like it was made for me — I've worn it three times in two weeks.", date: "2026-08-27", status: "Pending" },
  { id: "r2", customer: "Grace Otieno", location: "Nairobi", product: "Sahara Wrap Dress", rating: 5, text: "Beautiful fabric and the delivery was quick. Will definitely order again.", date: "2026-08-25", status: "Published" },
  { id: "r3", customer: "Njeri Kamau", location: "Nairobi", product: "Zola Occasion Dress", rating: 4, text: "Stunning dress, ran slightly long for me but the tailoring is worth it.", date: "2026-08-23", status: "Published" },
  { id: "r4", customer: "Diana Achieng", location: "Kisumu", product: "Everyday Set Short", rating: 2, text: "Colour was different from the photos on my screen.", date: "2026-08-20", status: "Rejected" },
  { id: "r5", customer: "Sarah Kiptoo", location: "Nairobi", product: "Sculpt Jumpsuit", rating: 5, text: "Elegant without trying. The Art of Being You is exactly right.", date: "2026-08-18", status: "Pending" },
];

export const mediaFiles = [
  { file: "aura-set-long.webp", folder: "Products", size: "412 KB", dims: "1600×2000", date: "2026-08-02" },
  { file: "aura-set-long-3.webp", folder: "Products", size: "388 KB", dims: "1600×2000", date: "2026-08-02" },
  { file: "aura-set-short-1.webp", folder: "Products", size: "356 KB", dims: "1600×2000", date: "2026-08-05" },
  { file: "signature-1.webp", folder: "Editorial", size: "521 KB", dims: "2000×2500", date: "2026-07-14" },
  { file: "sculpt-jumpsuit.webp", folder: "Products", size: "404 KB", dims: "1600×2000", date: "2026-07-21" },
  { file: "everyday-set-short-5.webp", folder: "Products", size: "298 KB", dims: "1600×2000", date: "2026-06-30" },
  { file: "everyday-set-long-1.webp", folder: "Products", size: "331 KB", dims: "1600×2000", date: "2026-06-28" },
  { file: "zola-1.webp", folder: "Editorial", size: "612 KB", dims: "2000×2500", date: "2026-08-18" },
  { file: "sahara.webp", folder: "Editorial", size: "487 KB", dims: "2000×2500", date: "2026-08-20" },
  { file: "hero.webp", folder: "Homepage", size: "744 KB", dims: "2400×1400", date: "2026-08-01" },
  { file: "after-dark.webp", folder: "Homepage", size: "689 KB", dims: "2000×1400", date: "2026-07-15" },
  { file: "brand-story.webp", folder: "Homepage", size: "553 KB", dims: "1800×1400", date: "2026-06-11" },
];

export const adminUsers = [
  { id: "a1", name: "Lucia Mwende", email: "lucia@lucebylucia.co.ke", role: "Super Admin", last: "Today, 08:12", status: "Active" },
  { id: "a2", name: "Brian Ochieng", email: "brian@lucebylucia.co.ke", role: "Admin", last: "Today, 07:44", status: "Active" },
  { id: "a3", name: "Tessa Njoki", email: "tessa@lucebylucia.co.ke", role: "Editor", last: "Yesterday, 18:03", status: "Active" },
  { id: "a4", name: "Kevin Maina", email: "kevin@lucebylucia.co.ke", role: "Order Manager", last: "2 days ago", status: "Active" },
  { id: "a5", name: "Joy Wambui", email: "joy@lucebylucia.co.ke", role: "Editor", last: "3 weeks ago", status: "Invited" },
];

export const rolePermissions: { role: string; access: string[] }[] = [
  { role: "Super Admin", access: ["Everything", "Admin users", "Site settings", "Payments"] },
  { role: "Admin", access: ["Orders", "Products", "Inventory", "Collections", "Homepage", "Media", "Customers", "Discounts"] },
  { role: "Editor", access: ["Products", "Collections", "Homepage", "Media"] },
  { role: "Order Manager", access: ["Orders", "Customers"] },
];

export const inventoryRows = products.flatMap((prod) =>
  prod.sizes.slice(0, 3).map((size, i) => {
    const stock = Math.max(0, Math.round(prod.qty / 3) - i);
    const reserved = stock > 2 ? (i % 3) + 1 : 0;
    return {
      id: `${prod.sku}-${size}`,
      product: prod.name,
      image: prod.image,
      variant: `${size} / ${prod.colors[i % prod.colors.length]}`,
      sku: `${prod.sku}-${size}`,
      stock,
      reserved,
      available: stock - reserved,
      threshold: prod.lowStock,
    };
  }),
);

export const adjustments = [
  { id: "j1", sku: "LUC-AUR-001-M", change: +12, reason: "Stock received", prev: 12, next: 24, user: "Brian Ochieng", at: "2026-08-28 09:14" },
  { id: "j2", sku: "LUC-SAH-041-S", change: -1, reason: "Sale", prev: 1, next: 0, user: "System", at: "2026-08-27 16:02" },
  { id: "j3", sku: "LUC-AUR-002-XS", change: +1, reason: "Return", prev: 3, next: 4, user: "Kevin Maina", at: "2026-08-26 11:31" },
  { id: "j4", sku: "LUC-SIG-020-M", change: -2, reason: "Damage", prev: 4, next: 2, user: "Lucia Mwende", at: "2026-08-25 14:50" },
  { id: "j5", sku: "LUC-EVR-031-L", change: +6, reason: "Manual adjustment", prev: 32, next: 38, user: "Brian Ochieng", at: "2026-08-24 08:20" },
];

export type HomeSection = {
  id: string;
  name: string;
  summary: string;
  enabled: boolean;
  image?: string;
};

export const homeSections: HomeSection[] = [
  { id: "hero", name: "Hero Section", summary: "New Season · The Art of Being You", enabled: true, image: "hero.webp" },
  { id: "ticker", name: "Ticker", summary: "4 items · Designed in Nairobi, M-Pesa Checkout…", enabled: true },
  { id: "featured-collection", name: "Featured Collection", summary: "New Season — Shop the Collection", enabled: true, image: "signature-1.webp" },
  { id: "categories", name: "Shop by Category", summary: "5 categories visible", enabled: true },
  { id: "new-arrivals", name: "New Arrivals", summary: "Automatic · newest 8 products", enabled: true },
  { id: "editorial", name: "Editorial · After Dark", summary: "Evening pieces with quiet drama", enabled: true, image: "after-dark.webp" },
  { id: "brand-story", name: "Brand Story", summary: "Made in Nairobi, worn everywhere", enabled: true, image: "brand-story.webp" },
  { id: "featured-products", name: "Featured Products", summary: "6 products selected manually", enabled: true },
  { id: "reviews", name: "Reviews", summary: "3 testimonials published", enabled: true },
  { id: "instagram", name: "Instagram", summary: "@lucebylucia · 6 images", enabled: false },
  { id: "newsletter", name: "Newsletter", summary: "Join the Luce list", enabled: true },
];

export const tickerItems = [
  "DESIGNED IN NAIROBI",
  "M-PESA CHECKOUT",
  "NATIONWIDE DELIVERY",
  "PREMIUM READY-TO-WEAR",
];
