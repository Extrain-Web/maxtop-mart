const mongoose = require('mongoose');

const DATABASE_URL = 'mongodb://root:AgJfPMKMYUJOnDmgHsGnTroEemY0R2bSrqYs0r91lkct6xYlnW0qo6M1Ka6i51W9@84.46.254.65:27019/maxtopmart?authSource=admin&directConnection=true';

const imageLinks = [
    'https://img.kwcdn.com/product/fancy/f502841d-30ce-4403-b650-8c255721e511.jpg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/open/110a3fa114ee49a2afbef0d8ab32ceb0-goods.jpeg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/open/1a69e84bfe1545d19078fe4be0843205-goods.jpeg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/open/a7c7f79f09bc40deb12528357e41c882-goods.jpeg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/fancy/6321ead5-ab01-4b1c-b61b-a13cf4c3193b.jpg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/fancy/1c5178f5-a0eb-4cd7-bc8b-70f59cd6038f.jpg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/fancy/f2a260f3-40c8-4656-934b-01f30e67c297.jpg?imageView2/2/w/500/q/70/format/avif',
    'https://img.kwcdn.com/product/open/2024-05-30/1717078591397-04437b3027e94d95999cd49e43549cd6-goods.jpeg?imageView2/2/w/500/q/70/format/avif'
];

const ProductSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seedProducts() {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB');

        const products = imageLinks.map((link, index) => {
            return {
                name: `Explore Your Interests Product ${index + 1}`,
                slug: `explore-your-interests-${index + 1}-${Date.now()}`,
                price: Math.floor(Math.random() * 500) + 100,
                originalPrice: Math.floor(Math.random() * 1000) + 600,
                discount: Math.floor(Math.random() * 50) + 10,
                description: 'This is a recommended product based on your interests. High quality and best price.',
                images: [link],
                thumbnail: link,
                totalSold: Math.floor(Math.random() * 1000),
                reviewCount: Math.floor(Math.random() * 200),
                rating: 4 + Math.random(),
                stock: 100,
                status: 'active'
            };
        });

        await Product.insertMany(products);
        console.log(`Inserted ${products.length} products`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedProducts();
