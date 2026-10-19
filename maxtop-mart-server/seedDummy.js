const mongoose = require('mongoose');

const DATABASE_URL = 'mongodb://root:AgJfPMKMYUJOnDmgHsGnTroEemY0R2bSrqYs0r91lkct6xYlnW0qo6M1Ka6i51W9@84.46.254.65:27019/maxtopmart?authSource=admin&directConnection=true';

async function updateProducts() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        // Update Polo
        await db.collection('products').updateOne({ name: /Polo/i }, {
            $set: {
                sizeChart: '<p>Polo Size Guide</p><table style=\"width:100%; border-collapse:collapse; text-align:center;\"><tr style=\"border-bottom:1px solid #ddd\"><th>Size</th><th>Chest</th></tr><tr><td>M</td><td>38</td></tr><tr><td>L</td><td>40</td></tr></table>',
                careInstructions: 'Machine wash warm, inside out, with like colors.',
                materialsInfo: '100% Pima Cotton.'
            }
        });

        // Update Watch (no size chart)
        await db.collection('products').updateOne({ name: /Watch/i }, {
            $set: {
                sizeChart: '', // NO SIZE CHART for watches
                careInstructions: 'Wipe gently with a soft cloth. Do not submerge in water unless specified as water-resistant.',
                materialsInfo: 'Stainless Steel casing, Sapphire Crystal glass.'
            }
        });

        console.log('Updated specific products for testing');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
updateProducts();
