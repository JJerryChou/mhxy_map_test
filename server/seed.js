
const db = require('./src/database');
const bcrypt = require('bcryptjs');

const seed = () => {
    const password = 'admin';
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.get("SELECT * FROM users WHERE username = 'admin'", [], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (row) {
            console.log('Admin user exists. Updating password to "admin"...');
            db.run('UPDATE users SET password = ? WHERE username = "admin"', [hashedPassword], (err) => {
                if (err) console.error('Error updating admin password:', err.message);
                else console.log('Admin password updated successfully.');
            });
        } else {
            const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
            stmt.run('admin', hashedPassword, 'admin', (err) => {
                if (err) {
                    console.error('Error creating admin user:', err.message);
                } else {
                    console.log('Admin user created. Username: admin, Password: admin');
                }
            });
            stmt.finalize();
        }
    });
};

seed();
