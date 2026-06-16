const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

// Fetch global activity logs
router.get('/logs', verifyToken, async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT l.*, u.name as user_name, u.role as user_role 
            FROM activity_logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC LIMIT 50
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all tasks
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT t.*, u.name as assignee_name, u.role as assignee_role 
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id
        `;
        const [tasks] = await db.query(query);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create task with auditing
router.post('/', verifyToken, async (req, res) => {
    const { title, description, assigned_to, status, priority, due_date, subtasks } = req.body;
    try {
        let subtasksJson = '[]';
        if (subtasks && subtasks.trim() !== '') {
            const subtaskArray = subtasks.split(',').map((s, index) => ({
                id: index + 1,
                title: s.trim(),
                completed: false
            }));
            subtasksJson = JSON.stringify(subtaskArray);
        }

        const [result] = await db.query(
            'INSERT INTO tasks (title, description, assigned_to, status, priority, due_date, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, assigned_to || null, status || 'pending', priority || 'medium', due_date || null, subtasksJson]
        );

        // Capture deployment log
        await db.query('INSERT INTO activity_logs (user_id, action_text) VALUES (?, ?)', 
            [req.user.id, `Created and deployed task: "${title}"`]
        );

        res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update status with auditing
router.put('/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const [taskRow] = await db.query('SELECT title FROM tasks WHERE id = ?', [id]);
        await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);

        // Capture milestone transition log
        if (taskRow.length > 0) {
            await db.query('INSERT INTO activity_logs (user_id, action_text) VALUES (?, ?)', 
                [req.user.id, `Shifted task "${taskRow[0].title}" to status: ${status.toUpperCase()}`]
            );
        }
        res.json({ message: 'Task status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle subtask with auditing
router.put('/:id/subtask', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { subtaskId, completed } = req.body;
    try {
        const [rows] = await db.query('SELECT title, subtasks FROM tasks WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
        
        let subtasks = rows[0].subtasks || [];
        if (typeof subtasks === 'string') subtasks = JSON.parse(subtasks);

        let targetSubtaskTitle = "";
        subtasks = subtasks.map(st => {
            if (st.id === subtaskId) {
                targetSubtaskTitle = st.title;
                return { ...st, completed };
            }
            return st;
        });

        await db.query('UPDATE tasks SET subtasks = ? WHERE id = ?', [JSON.stringify(subtasks), id]);

        // Capture item completion log
        await db.query('INSERT INTO activity_logs (user_id, action_text) VALUES (?, ?)', 
            [req.user.id, `${completed ? 'Checked off' : 'Reopened'} subtask "${targetSubtaskTitle}" under "${rows[0].title}"`]
        );

        res.json({ message: 'Subtask updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🚀 FIXED: Role-Based Deletion with Type-Safe Number Comparisons
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Query target details and current target profile roles
        const [taskRows] = await db.query(`
            SELECT t.title, t.assigned_to, u.role as assignee_role 
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id 
            WHERE t.id = ?
        `, [id]);

        if (taskRows.length === 0) return res.status(404).json({ message: 'Task allocation entry not found' });
        const targetTask = taskRows[0];

        let accessClearance = false;

        // Force both values to Numbers to prevent String vs Number strict comparison drops
        const assigneeId = targetTask.assigned_to ? Number(targetTask.assigned_to) : null;
        const currentUserId = Number(req.user.id);

        // Apply strict operational rules matching your business layer matrix
        if (req.user.role === 'admin') {
            accessClearance = true; // Admins delete anything
        } else if (req.user.role === 'manager') {
            // Managers delete self assignments OR entries given to standard members
            if (assigneeId === currentUserId || targetTask.assignee_role === 'member' || !targetTask.assigned_to) {
                accessClearance = true;
            }
        } else if (req.user.role === 'member') {
            // Standard members delete ONLY their own tracked personal entries
            if (assigneeId === currentUserId) {
                accessClearance = true;
            }
        }

        if (!accessClearance) {
            return res.status(403).json({ message: 'Access Denied: Insufficient deletion clearance parameters.' });
        }

        // Execute hard removal sequence
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);

        // Append historical record entry to permanent logs tracking pool
        await db.query('INSERT INTO activity_logs (user_id, action_text) VALUES (?, ?)', 
            [req.user.id, `Permanently purged task item sequence: "${targetTask.title}"`]
        );

        res.json({ message: 'Task entity successfully cleared from tracking nodes.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;