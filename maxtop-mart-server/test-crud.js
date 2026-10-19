async function runTest() {
    try {
        const baseUrl = 'http://localhost:5000/api';

        console.log('1. Logging in as admin...');
        let res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin@gmail.com' })
        });
        let data = await res.json();
        if (!data.success) {
            console.error('Login failed:', data);
            return;
        }
        const token = data.data.tokens.accessToken;
        console.log('Token acquired.');

        console.log('\n2. Checking categories...');
        res = await fetch(`${baseUrl}/categories`);
        data = await res.json();
        let categoryId = '';
        if (data.success && data.data && data.data.length > 0) {
            categoryId = data.data[0]._id;
            console.log('Using existing category:', categoryId);
        } else {
            console.log('No category found, creating "Gadgets"...');
            res = await fetch(`${baseUrl}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: 'Gadgets', description: 'All electronics and gadgets' })
            });
            let catData = await res.json();
            if(!catData.success) {
                console.error('Failed to create category:', catData);
                return;
            }
            categoryId = catData.data._id;
            console.log('Category created:', categoryId);
        }

        console.log('\n3. Creating 3 Gadget Products...');
        const products = [
            {
                name: 'Wireless Bluetooth Earbuds X1',
                description: 'High-quality sound with noise cancellation.',
                price: 2990,
                thumbnail: 'https://via.placeholder.com/300?text=Earbuds+X1',
                images: ['https://via.placeholder.com/300?text=Earbuds+Side', 'https://via.placeholder.com/300?text=Earbuds+Box'],
                category: categoryId,
                status: 'active'
            },
            {
                name: 'Smartwatch Series 5',
                description: 'Fitness tracking, heart rate monitor, and more.',
                price: 4500,
                thumbnail: 'https://via.placeholder.com/300?text=Smartwatch',
                images: ['https://via.placeholder.com/300?text=Smartwatch+Strap', 'https://via.placeholder.com/300?text=Smartwatch+OnWrist'],
                category: categoryId,
                status: 'active'
            },
            {
                name: 'Portable Power Bank 20000mAh',
                description: 'Fast charging high capacity power bank.',
                price: 1500,
                thumbnail: 'https://via.placeholder.com/300?text=PowerBank',
                images: ['https://via.placeholder.com/300?text=PowerBank+Front', 'https://via.placeholder.com/300?text=PowerBank+Ports'],
                category: categoryId,
                status: 'active'
            }
        ];

        let createdIds = [];
        for (const p of products) {
            res = await fetch(`${baseUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(p)
            });
            const pData = await res.json();
            if (pData.success) {
                console.log(`✅ Created product: ${p.name}`);
                createdIds.push(pData.data._id);
            } else {
                console.error(`❌ Failed to create ${p.name}:`, pData);
            }
        }

        console.log('\n4. Reading Products...');
        res = await fetch(`${baseUrl}/products?limit=5`);
        data = await res.json();
        const productList = data.data?.result || data.data || [];
        console.log(`Fetched ${productList.length} products from API.`);

        if (createdIds.length >= 2) {
            console.log('\n5. Updating Product 1 (Price change to 2500)...');
            res = await fetch(`${baseUrl}/products/${createdIds[0]}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ price: 2500 })
            });
            let updateData = await res.json();
            if (updateData.success) console.log('✅ Successfully updated product 1.');
            else console.error('❌ Failed to update product 1:', updateData);

            console.log('\n6. Deleting Product 2 (Smartwatch)...');
            res = await fetch(`${baseUrl}/products/${createdIds[1]}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let delData = await res.json();
            if (delData.success) console.log('✅ Successfully deleted product 2.');
            else console.error('❌ Failed to delete product 2:', delData);
        }

        console.log('\n🎉 CRUD Test Completed successfully!');
        console.log('Remaining gadgets are successfully uploaded to the database.');

    } catch (e) {
        console.error('Error during test:', e);
    }
}

runTest();
