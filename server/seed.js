
const db = require('./src/database');
const bcrypt = require('bcryptjs');
const { adminPassword, adminUsername, resetAdminPassword } = require('./src/config');

const closeDatabase = () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
    });
};

const seed = async () => {
    try {
        await db.ready;
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
        return;
    }

    if (!adminPassword) {
        console.error('ADMIN_PASSWORD is required to bootstrap an admin user.');
        process.exitCode = 1;
        closeDatabase();
        return;
    }

    const hashedPassword = bcrypt.hashSync(adminPassword, 8);

    db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, row) => {
        if (err) {
            console.error(err.message);
            process.exitCode = 1;
            closeDatabase();
            return;
        }
        if (row) {
            if (!resetAdminPassword) {
                console.log(`Admin user "${adminUsername}" already exists. Skipping bootstrap.`);
                closeDatabase();
                return;
            }

            console.log(`Admin user "${adminUsername}" exists. Resetting password...`);
            db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, adminUsername], (err) => {
                if (err) console.error('Error updating admin password:', err.message);
                else console.log('Admin password updated successfully.');
                if (err) process.exitCode = 1;
                closeDatabase();
            });
        } else {
            const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
            stmt.run(adminUsername, hashedPassword, 'admin', (err) => {
                if (err) {
                    console.error('Error creating admin user:', err.message);
                    process.exitCode = 1;
                } else {
                    console.log(`Admin user created. Username: ${adminUsername}`);
                }
            });
            stmt.finalize(closeDatabase);
        }
    });
};

seed();
