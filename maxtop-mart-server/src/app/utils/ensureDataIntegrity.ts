import mongoose from 'mongoose';

/**
 * Ensures data integrity across deployments:
 * 1. Guarantees at least one active default category exists.
 * 2. Repairs legacy or uninitialized products:
 *    - sets status to 'active' if missing or invalid
 *    - sets isDeleted to false if missing
 *    - assigns default category if missing
 *    - ensures realistic stock (minimum 50) if missing or non-positive
 *    - generates slug if missing
 */
export async function ensureDataIntegrity(): Promise<void> {
    try {
        const db = mongoose.connection.db;
        if (!db) return;

        const categoriesCol = db.collection('categories');
        let defaultCat = await categoriesCol.findOne({ isDeleted: { $ne: true } });
        if (!defaultCat) {
            const catRes = await categoriesCol.insertOne({
                name: 'General',
                slug: 'general',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            defaultCat = { _id: catRes.insertedId, name: 'General' };
            console.log('📦 Data integrity: created default category');
        }

        const productsCol = db.collection('products');
        const legacyProducts = await productsCol.find({
            $or: [
                { status: { $exists: false } },
                { status: null },
                { isDeleted: { $exists: false } },
                { category: { $exists: false } },
                { category: null },
                { stock: { $exists: false } },
                { stock: null },
                { stock: { $lte: 0 } },
            ],
        }).toArray();

        if (legacyProducts.length > 0) {
            console.log(`📦 Data integrity: repairing ${legacyProducts.length} legacy products...`);
            for (const prod of legacyProducts) {
                const updates: any = {};
                if (!prod.status || prod.status === 'draft') {
                    updates.status = 'active';
                }
                if (prod.isDeleted === undefined || prod.isDeleted === null) {
                    updates.isDeleted = false;
                }
                if (!prod.category) {
                    updates.category = defaultCat._id;
                }
                if (typeof prod.stock !== 'number' || prod.stock <= 0) {
                    updates.stock = 100;
                }
                if (!prod.slug) {
                    updates.slug = (prod.name || 'product')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '') + '-' + prod._id.toString().slice(-4);
                }

                if (Object.keys(updates).length > 0) {
                    await productsCol.updateOne({ _id: prod._id }, { $set: updates });
                }
            }
            console.log(`📦 Data integrity: successfully repaired ${legacyProducts.length} products`);
        }
    } catch (error) {
        console.error('📦 Data integrity check error (non-fatal):', (error as Error).message);
    }
}
