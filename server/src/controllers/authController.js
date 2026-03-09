
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'fantasy-westward-journey-secret-key';

exports.register = (req, res) => {
    const { username, password, role } = req.body;
    // Only verify basic fields. Role should be handled carefully in production (e.g. only admin can create admin)
    // For this demo, we allow passing role directly unless we restrict it.
    // The requirement says "Admin can create users".
    // So distinct register endpoint for admin might be needed, or we check req.user.role here if it's a protected route.
    // For initial seed/setup, we might need a public register or a seed script.
    // Let's implement a public register for the FIRST admin, or just a generic register for now.

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    stmt.run(username, hashedPassword, userRole, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, username, role: userRole });
    });
    stmt.finalize();
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password.' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        res.json({ auth: true, token, user: { id: user.id, username: user.username, role: user.role } });
    });
};

exports.getMe = (req, res) => {
    db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: 'There was a problem finding the user.' });
        if (!user) return res.status(404).json({ error: 'No user found.' });
        res.json(user);
    });
};
