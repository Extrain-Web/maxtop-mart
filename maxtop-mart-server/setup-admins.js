const { execSync } = require('child_process');

async function setup() {
    try {
        console.log("Registering superadmin...");
        let res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: "Super",
                lastName: "Admin",
                email: "superadmin@gmail.com",
                password: "superadmin@gmail.com"
            })
        });
        let data = await res.json();
        console.log("Result:", data);
        
        console.log("Promoting to superadmin...");
        execSync('node scripts/make-admin.js superadmin@gmail.com superadmin', { stdio: 'inherit' });

        console.log("Registering admin...");
        res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: "Admin",
                lastName: "User",
                email: "admin@gmail.com",
                password: "admin@gmail.com"
            })
        });
        data = await res.json();
        console.log("Result:", data);

        console.log("Promoting to admin...");
        execSync('node scripts/make-admin.js admin@gmail.com admin', { stdio: 'inherit' });

        console.log("All done!");
    } catch(e) {
        console.error(e);
    }
}

setup();
