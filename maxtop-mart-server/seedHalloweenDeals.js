require('dotenv').config();
const mongoose = require('mongoose');

const imageLinks = [
    "https://img.kwcdn.com/product/fancy/f502841d-30ce-4403-b650-8c255721e511.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/110a3fa114ee49a2afbef0d8ab32ceb0-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/1a69e84bfe1545d19078fe4be0843205-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/a7c7f79f09bc40deb12528357e41c882-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/6321ead5-ab01-4b1c-b61b-a13cf4c3193b.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/1c5178f5-a0eb-4cd7-bc8b-70f59cd6038f.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/f2a260f3-40c8-4656-934b-01f30e67c297.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/2024-05-30/1717078591397-04437b3027e94d95999cd49e43549cd6-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/cc87ecd2-7916-4ed8-86fa-418a71b8a42e.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/cc87ecd2-7916-4ed8-86fa-418a71b8a42e.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/896efe2a-9717-4219-ae79-af9aa6e90bab.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/eb01081d-dfb6-4cee-922b-fc4f6da74af9.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/a7bd1933-4a11-4b68-a38f-3f464980e127.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/e777a261-d4f4-4111-bd75-931f0c6f0077.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/3e9c918a-14d3-4345-94cb-311adf5fa515.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/9c06d59c-ca9e-469f-a439-e115e123536b.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/bde67bce-9364-42bd-9562-087a0d51140c.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/e603eb6e-59e2-4ff0-8448-75729df1ec3f.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/2568e610-3084-43e5-a3d1-841b3dc2a96c.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/730bc53a-1c93-4878-895a-206871da5afc.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/ac6b6aa6-452a-4c47-b3c0-0d7b7e4d7ae1.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/92c201bc7302403596169ddf4dfba725-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/2f0dbd13-6a8a-4cc7-a10a-52eb4e9cd2a1.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/4e1246ae-c942-4fb4-83e6-48aaefaae5f1.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/f59f1c3f-b6a7-4e22-8105-1628273a56e0.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/45559838-9a77-496f-8e63-86c9fdba933e.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/d0d92f9b-3cb4-4839-8290-35d966e964a5.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/fancy/2af4a0a3-0dc4-4fb6-bdf4-d5da6494d859.jpg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/50d18af4942b44bbac4befd265a1f351-goods.jpeg?imageView2/2/w/500/q/70/format/avif",
    "https://img.kwcdn.com/product/open/08c78b3505884c9db688431bab03a12f-goods.jpeg?imageView2/2/w/500/q/70/format/avif"
];

async function seedHalloweenProducts() {
    try {
        const url = process.env.DATABASE_URL;
        if (!url || url.includes('<cluster>')) {
            console.error("Please add a valid DATABASE_URL in .env before seeding.");
            process.exit(1);
        }
        await mongoose.connect(url);
        const db = mongoose.connection.db;

        const productsToInsert = imageLinks.map((img, idx) => ({
            name: `Halloween Special Product ${idx + 1}`,
            slug: `halloween-special-product-${idx + 1}-${Date.now()}`,
            description: "An amazing product perfect for Halloween season.",
            thumbnail: img,
            images: [img],
            price: Math.floor(Math.random() * 20) + 5,
            originalPrice: Math.floor(Math.random() * 50) + 20,
            stock: 100,
            tag: idx % 2 === 0 ? "Halloween" : "Local",
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const result = await db.collection('products').insertMany(productsToInsert);
        console.log(`Successfully seeded ${result.insertedCount} Halloween products!`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}
seedHalloweenProducts();
