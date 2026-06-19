export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  discountPercent: number
  rating: number
  reviewCount: number
  category: 'Electronics' | 'Books' | 'Clothing' | 'Home & Kitchen' | 'Sports' | 'Beauty'
  imageUrl: string
  thumbnails: string[]
  inStock: boolean
  stockCount: number
  badge: 'Best Seller' | 'New' | 'Deal' | 'Limited' | null
  features: string[]
  brand: string
  sku: string
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001', name: 'UltraBook Pro 15"', description: 'Thin and powerful laptop with 12-core processor and 18-hour battery life. Perfect for professionals on the go.', price: 1299, originalPrice: 1599, discountPercent: 19, rating: 4.7, reviewCount: 2341, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod001/400/400', thumbnails: ['https://picsum.photos/seed/prod001a/400/400', 'https://picsum.photos/seed/prod001b/400/400'], inStock: true, stockCount: 12, badge: 'Best Seller', brand: 'TechPro', sku: 'TP-UB-15-001',
    features: ['12-core M3 processor', '16GB unified memory', '512GB SSD', '18-hour battery', 'Retina display', 'Thunderbolt 4 ports'],
  },
  {
    id: 'prod-002', name: 'ProSound Headphones X1', description: 'Studio-quality wireless headphones with active noise cancellation and 30-hour playtime.', price: 299, originalPrice: 399, discountPercent: 25, rating: 4.8, reviewCount: 4512, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod002/400/400', thumbnails: ['https://picsum.photos/seed/prod002a/400/400', 'https://picsum.photos/seed/prod002b/400/400'], inStock: true, stockCount: 45, badge: 'Deal', brand: 'AudioElite', sku: 'AE-X1-BLK',
    features: ['Active Noise Cancellation', '30-hour battery', 'Bluetooth 5.3', 'Foldable design', 'Premium drivers', 'USB-C charging'],
  },
  {
    id: 'prod-003', name: 'SmartPhone Z9 Ultra', description: 'Flagship smartphone with 200MP camera, 6.8" AMOLED display, and 5000mAh battery.', price: 999, originalPrice: 1199, discountPercent: 17, rating: 4.6, reviewCount: 1876, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod003/400/400', thumbnails: ['https://picsum.photos/seed/prod003a/400/400', 'https://picsum.photos/seed/prod003b/400/400'], inStock: true, stockCount: 23, badge: null, brand: 'NexTech', sku: 'NT-Z9U-256',
    features: ['200MP main camera', '6.8" 120Hz AMOLED', '5000mAh battery', '45W fast charging', '5G ready', '256GB storage'],
  },
  {
    id: 'prod-004', name: 'TabView Pro 12"', description: 'Powerful tablet with M2 chip, 12-inch Liquid Retina display ideal for creative work.', price: 799, originalPrice: 899, discountPercent: 11, rating: 4.5, reviewCount: 987, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod004/400/400', thumbnails: ['https://picsum.photos/seed/prod004a/400/400', 'https://picsum.photos/seed/prod004b/400/400'], inStock: true, stockCount: 8, badge: 'Limited', brand: 'TechPro', sku: 'TP-TAB-12-256',
    features: ['M2 chip', '12" Liquid Retina', 'Apple Pencil support', '10-hour battery', 'USB-C', 'Face ID'],
  },
  {
    id: 'prod-005', name: 'MirrorLens DSLR 4K', description: 'Professional mirrorless camera with 45MP full-frame sensor and 8K video capability.', price: 2499, originalPrice: 2999, discountPercent: 17, rating: 4.9, reviewCount: 654, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod005/400/400', thumbnails: ['https://picsum.photos/seed/prod005a/400/400', 'https://picsum.photos/seed/prod005b/400/400'], inStock: true, stockCount: 5, badge: 'Limited', brand: 'OpticPro', sku: 'OP-ML4K-BODY',
    features: ['45MP full-frame sensor', '8K video', 'Dual card slots', '5-axis stabilization', '4K120fps', 'Weather sealed'],
  },
  {
    id: 'prod-006', name: 'WristTech Smart 3', description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.', price: 349, originalPrice: 399, discountPercent: 13, rating: 4.4, reviewCount: 3201, category: 'Electronics', imageUrl: 'https://picsum.photos/seed/prod006/400/400', thumbnails: ['https://picsum.photos/seed/prod006a/400/400'], inStock: true, stockCount: 34, badge: 'New', brand: 'WristTech', sku: 'WT-S3-45MM',
    features: ['Heart rate + ECG', 'GPS tracking', '7-day battery', 'Sleep tracking', 'Water resistant', 'AMOLED display'],
  },
  {
    id: 'prod-007', name: 'Clean Code (2nd Ed)', description: 'Essential guide to writing clean, maintainable software. A must-read for every developer.', price: 49, originalPrice: 59, discountPercent: 17, rating: 4.8, reviewCount: 8765, category: 'Books', imageUrl: 'https://picsum.photos/seed/prod007/400/400', thumbnails: ['https://picsum.photos/seed/prod007a/400/400'], inStock: true, stockCount: 100, badge: 'Best Seller', brand: 'Prentice Hall', sku: 'BK-CC-2ED',
    features: ['Hardcover', '464 pages', 'Code examples', 'Refactoring techniques', 'Best practices', 'Updated for modern languages'],
  },
  {
    id: 'prod-008', name: 'System Design Interview', description: 'Comprehensive guide to acing system design interviews at top tech companies.', price: 39, originalPrice: 45, discountPercent: 13, rating: 4.7, reviewCount: 5432, category: 'Books', imageUrl: 'https://picsum.photos/seed/prod008/400/400', thumbnails: ['https://picsum.photos/seed/prod008a/400/400'], inStock: true, stockCount: 200, badge: null, brand: 'ByteByByte', sku: 'BK-SDI-V2',
    features: ['Paperback', '320 pages', 'Real case studies', 'Scalability patterns', 'Database design', 'Microservices'],
  },
  {
    id: 'prod-009', name: 'Atomic Habits', description: 'The life-changing million-copy bestseller about building good habits and breaking bad ones.', price: 27, originalPrice: 32, discountPercent: 16, rating: 4.9, reviewCount: 12341, category: 'Books', imageUrl: 'https://picsum.photos/seed/prod009/400/400', thumbnails: ['https://picsum.photos/seed/prod009a/400/400'], inStock: true, stockCount: 500, badge: 'Best Seller', brand: 'Penguin', sku: 'BK-AH-HC',
    features: ['Hardcover', '320 pages', 'Habit stacking', 'Identity-based habits', 'Science-backed', 'Bestseller'],
  },
  {
    id: 'prod-010', name: 'Designing Data-Intensive Apps', description: 'The go-to guide for building reliable, scalable, and maintainable applications.', price: 59, originalPrice: 69, discountPercent: 14, rating: 4.8, reviewCount: 4321, category: 'Books', imageUrl: 'https://picsum.photos/seed/prod010/400/400', thumbnails: ['https://picsum.photos/seed/prod010a/400/400'], inStock: true, stockCount: 150, badge: null, brand: "O'Reilly", sku: 'BK-DDIA-1ED',
    features: ['Paperback', '612 pages', 'Distributed systems', 'Data modeling', 'Stream processing', 'Database internals'],
  },
  {
    id: 'prod-011', name: 'UrbanFlex Jogger Pants', description: 'Premium moisture-wicking joggers with 4-way stretch perfect for gym or casual wear.', price: 79, originalPrice: 99, discountPercent: 20, rating: 4.5, reviewCount: 2134, category: 'Clothing', imageUrl: 'https://picsum.photos/seed/prod011/400/400', thumbnails: ['https://picsum.photos/seed/prod011a/400/400'], inStock: true, stockCount: 67, badge: 'Deal', brand: 'UrbanFlex', sku: 'UF-JP-M-BLK',
    features: ['4-way stretch', 'Moisture wicking', 'Zippered pockets', 'Tapered fit', 'Machine washable', 'Anti-odor'],
  },
  {
    id: 'prod-012', name: 'Alpine Waterproof Jacket', description: 'Lightweight waterproof jacket with 10,000mm rating and fully taped seams.', price: 189, originalPrice: 249, discountPercent: 24, rating: 4.6, reviewCount: 876, category: 'Clothing', imageUrl: 'https://picsum.photos/seed/prod012/400/400', thumbnails: ['https://picsum.photos/seed/prod012a/400/400'], inStock: true, stockCount: 23, badge: 'New', brand: 'AlpineGear', sku: 'AG-WJ-M-NVY',
    features: ['10,000mm waterproof', 'Sealed seams', 'Packable design', 'Vented pits', 'Helmet-compatible hood', '3-layer fabric'],
  },
  {
    id: 'prod-013', name: 'ComfortFit Classic Tee', description: 'Premium 100% organic cotton t-shirt with a relaxed fit and lasting comfort.', price: 35, originalPrice: 45, discountPercent: 22, rating: 4.3, reviewCount: 3456, category: 'Clothing', imageUrl: 'https://picsum.photos/seed/prod013/400/400', thumbnails: ['https://picsum.photos/seed/prod013a/400/400'], inStock: true, stockCount: 200, badge: null, brand: 'EcoWear', sku: 'EW-CFT-L-WHT',
    features: ['100% organic cotton', 'Pre-shrunk', 'Relaxed fit', 'Sustainably made', 'Tagless', 'Machine washable'],
  },
  {
    id: 'prod-014', name: 'SlimFit Chino Pants', description: 'Versatile slim-fit chinos suitable for both office and casual settings.', price: 89, originalPrice: 110, discountPercent: 19, rating: 4.4, reviewCount: 1543, category: 'Clothing', imageUrl: 'https://picsum.photos/seed/prod014/400/400', thumbnails: ['https://picsum.photos/seed/prod014a/400/400'], inStock: true, stockCount: 45, badge: null, brand: 'UrbanFlex', sku: 'UF-SFC-32-KHK',
    features: ['Slim fit', 'Stretch cotton', '4 pockets', 'Mid-rise', 'Machine washable', 'Versatile styling'],
  },
  {
    id: 'prod-015', name: 'SmartChef Air Fryer 6L', description: 'Digital air fryer with 12 cooking presets and 6-liter capacity for the whole family.', price: 129, originalPrice: 169, discountPercent: 24, rating: 4.7, reviewCount: 5678, category: 'Home & Kitchen', imageUrl: 'https://picsum.photos/seed/prod015/400/400', thumbnails: ['https://picsum.photos/seed/prod015a/400/400'], inStock: true, stockCount: 34, badge: 'Best Seller', brand: 'SmartChef', sku: 'SC-AF6L-BLK',
    features: ['6L capacity', '12 presets', 'Digital display', 'Non-stick basket', 'Dishwasher safe', 'Energy efficient'],
  },
  {
    id: 'prod-016', name: 'ErgoDesk Standing Mat', description: 'Premium anti-fatigue standing mat with beveled edges for comfort during long work sessions.', price: 89, originalPrice: 119, discountPercent: 25, rating: 4.5, reviewCount: 2341, category: 'Home & Kitchen', imageUrl: 'https://picsum.photos/seed/prod016/400/400', thumbnails: ['https://picsum.photos/seed/prod016a/400/400'], inStock: true, stockCount: 56, badge: 'Deal', brand: 'ErgoLife', sku: 'EL-SDM-BLK',
    features: ['Anti-fatigue foam', 'Beveled edges', 'Non-slip bottom', 'Waterproof', 'Easy clean', '20mm thick'],
  },
  {
    id: 'prod-017', name: 'PressoPro Espresso Machine', description: 'Barista-quality espresso machine with 15-bar pressure and built-in milk frother.', price: 399, originalPrice: 499, discountPercent: 20, rating: 4.6, reviewCount: 1234, category: 'Home & Kitchen', imageUrl: 'https://picsum.photos/seed/prod017/400/400', thumbnails: ['https://picsum.photos/seed/prod017a/400/400'], inStock: true, stockCount: 18, badge: null, brand: 'PressoPro', sku: 'PP-EM-1500-SS',
    features: ['15-bar pump', 'Milk frother', 'Double shot', 'Warming plate', '1.5L tank', 'Stainless steel'],
  },
  {
    id: 'prod-018', name: 'OmniBlend Pro Blender', description: 'High-performance blender with 1800W motor and self-cleaning function for smoothies and soups.', price: 159, originalPrice: 199, discountPercent: 20, rating: 4.4, reviewCount: 876, category: 'Home & Kitchen', imageUrl: 'https://picsum.photos/seed/prod018/400/400', thumbnails: ['https://picsum.photos/seed/prod018a/400/400'], inStock: true, stockCount: 29, badge: 'New', brand: 'OmniBlend', sku: 'OB-PRO-1800',
    features: ['1800W motor', 'Self-cleaning', '6-blade system', '2L jar', '5 speed settings', 'BPA-free'],
  },
  {
    id: 'prod-019', name: 'TrailRunner X5 Shoes', description: 'All-terrain trail running shoes with rock plate and responsive cushioning for technical terrain.', price: 139, originalPrice: 169, discountPercent: 18, rating: 4.6, reviewCount: 1876, category: 'Sports', imageUrl: 'https://picsum.photos/seed/prod019/400/400', thumbnails: ['https://picsum.photos/seed/prod019a/400/400'], inStock: true, stockCount: 34, badge: 'Best Seller', brand: 'TrailPro', sku: 'TP-TX5-10-GRY',
    features: ['Rock plate protection', 'Grippy outsole', 'Breathable upper', 'Responsive foam', 'Waterproof option', 'Wide toe box'],
  },
  {
    id: 'prod-020', name: 'PowerFlex Resistance Bands', description: 'Professional resistance band set with 5 resistance levels and carrying bag for home workouts.', price: 49, originalPrice: 69, discountPercent: 29, rating: 4.5, reviewCount: 4312, category: 'Sports', imageUrl: 'https://picsum.photos/seed/prod020/400/400', thumbnails: ['https://picsum.photos/seed/prod020a/400/400'], inStock: true, stockCount: 200, badge: 'Deal', brand: 'PowerFlex', sku: 'PF-RB5-SET',
    features: ['5 resistance levels', 'Anti-snap latex', 'Non-slip handles', 'Ankle straps', 'Door anchor', 'Carry bag'],
  },
  {
    id: 'prod-021', name: 'YogaFlow Premium Mat', description: 'Eco-friendly non-slip yoga mat with alignment lines and carrying strap.', price: 79, originalPrice: 95, discountPercent: 17, rating: 4.7, reviewCount: 2345, category: 'Sports', imageUrl: 'https://picsum.photos/seed/prod021/400/400', thumbnails: ['https://picsum.photos/seed/prod021a/400/400'], inStock: true, stockCount: 67, badge: 'New', brand: 'YogaFlow', sku: 'YF-PM-6MM-GRN',
    features: ['6mm thickness', 'Eco-friendly TPE', 'Alignment lines', 'Non-slip texture', 'Carrying strap', 'Easy clean'],
  },
  {
    id: 'prod-022', name: 'GlowSerum Vitamin C', description: 'Brightening vitamin C serum with 20% L-ascorbic acid that reduces dark spots and boosts radiance.', price: 59, originalPrice: 79, discountPercent: 25, rating: 4.6, reviewCount: 3456, category: 'Beauty', imageUrl: 'https://picsum.photos/seed/prod022/400/400', thumbnails: ['https://picsum.photos/seed/prod022a/400/400'], inStock: true, stockCount: 89, badge: 'Best Seller', brand: 'GlowLab', sku: 'GL-VCS-30ML',
    features: ['20% Vitamin C', 'Hyaluronic acid', 'Ferulic acid', 'Dark spot reducer', 'Fragrance-free', 'Dermatologist tested'],
  },
  {
    id: 'prod-023', name: 'HydraFusion Moisturizer', description: '72-hour hydrating moisturizer with ceramides and peptides for all skin types.', price: 45, originalPrice: 55, discountPercent: 18, rating: 4.5, reviewCount: 2876, category: 'Beauty', imageUrl: 'https://picsum.photos/seed/prod023/400/400', thumbnails: ['https://picsum.photos/seed/prod023a/400/400'], inStock: true, stockCount: 120, badge: null, brand: 'HydraLab', sku: 'HL-HFM-50ML',
    features: ['72-hour hydration', 'Ceramides complex', 'Peptides blend', 'SPF 30', 'Non-comedogenic', 'Suitable all skin types'],
  },
  {
    id: 'prod-024', name: 'SunShield SPF 50+ Sunscreen', description: 'Lightweight invisible sunscreen with mineral and chemical filters, water-resistant for 80 minutes.', price: 29, originalPrice: 39, discountPercent: 26, rating: 4.4, reviewCount: 4567, category: 'Beauty', imageUrl: 'https://picsum.photos/seed/prod024/400/400', thumbnails: ['https://picsum.photos/seed/prod024a/400/400'], inStock: true, stockCount: 234, badge: 'Deal', brand: 'SunGuard', sku: 'SG-SS50-100ML',
    features: ['SPF 50+', 'Water-resistant 80min', 'No white cast', 'Broad spectrum', 'Reef safe', 'Antioxidants'],
  },
]

export const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports', 'Beauty'] as const
