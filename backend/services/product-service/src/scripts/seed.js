const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../../../../config/.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

const Product = require('../models/Product');
const Category = require('../models/Category');

const categoriesData = [
  { 
    name: 'Electronics', 
    icon: 'monitor',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop'
  },
  { 
    name: 'Clothing', 
    icon: 'shopping-bag',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop'
  },
  { 
    name: 'Home & Garden', 
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
  },
  { 
    name: 'Books', 
    icon: 'book',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=600&fit=crop'
  },
  { 
    name: 'Sports', 
    icon: 'activity',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop'
  },
  { 
    name: 'Toys', 
    icon: 'smile',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&h=600&fit=crop'
  },
  { 
    name: 'Beauty', 
    icon: 'heart',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop'
  },
  { 
    name: 'Automotive', 
    icon: 'truck',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop'
  }
];

const adjectives = ['Premium', 'Deluxe', 'Standard', 'Basic', 'Ultimate', 'Pro', 'Smart', 'Eco-friendly', 'Compact', 'Heavy-duty', 'Modern', 'Vintage', 'Sleek', 'Robust'];
const nouns = ['Widget', 'Gadget', 'Device', 'Tool', 'Accessory', 'Module', 'System', 'Unit', 'Machine', 'Instrument', 'Appliance', 'Kit', 'Bundle', 'Set'];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const generatePrice = () => {
    return Math.floor(Math.random() * 50000) / 100 + 10; // 10.00 to 510.00
};

const generateRandomProduct = (index, categories) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const name = `${adj} ${noun} ${index + 1}`;
    const slug = slugify(name);
    
    // Ensure at least one image is primary
    const images = [
        {
            url: `https://picsum.photos/seed/${slug}/800/800`,
            alt: name,
            isPrimary: true
        },
        {
            url: `https://picsum.photos/seed/${slug}-2/800/800`,
            alt: `${name} view 2`,
            isPrimary: false
        }
    ];

    const price = generatePrice();

    return {
        name: name,
        slug: slug,
        description: `Experience the excellence of our ${name}. Designed for performance and built to last, this ${category.name.toLowerCase()} item is a perfect addition to your collection. Features premium materials and intuitive design.`,
        price: price,
        compareAtPrice: Math.random() > 0.6 ? price * 1.5 : undefined,
        category: category._id,
        status: 'active',
        images: images,
        inventory: {
            quantity: Math.floor(Math.random() * 200),
            sku: `SKU-${10000 + index}`,
            trackInventory: true,
            lowStockThreshold: 10
        },
        tags: [category.name.toLowerCase(), adj.toLowerCase(), 'demo'],
        isFeatured: Math.random() > 0.85,
        ratings: {
            average: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
            count: Math.floor(Math.random() * 100)
        }
    };
};

const seed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI environment variable is not defined.');
            console.error('Please check if ' + envPath + ' exists and contains MONGODB_URI.');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Product.deleteMany({});
        await Category.deleteMany({});

        // Insert Categories with slugs
        console.log('Seeding categories...');
        const categories = categoriesData.map(c => ({
            ...c,
            slug: slugify(c.name)
        }));
        const createdCategories = await Category.insertMany(categories);
        console.log(`Created ${createdCategories.length} categories`);

        // Generate Products
        console.log('Generating products...');
        const products = [];
        for (let i = 0; i < 135; i++) {
            products.push(generateRandomProduct(i, createdCategories));
        }

        console.log('Inserting products...');
        await Product.insertMany(products);
        console.log(`Successfully created ${products.length} products`);

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seed();
