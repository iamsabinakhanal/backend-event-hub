import express from 'express';
import { AdminUserController } from '../controller/admin/admin_controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { upload } from '../config/multer';

const router = express.Router();
const adminUserController = new AdminUserController();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET all users
router.get('/users', (req, res) => adminUserController.getAllUsers(req, res));

// GET user by ID
router.get('/users/:id', (req, res) => adminUserController.getUserById(req, res));

// POST create new user (with optional image upload)
router.post('/users', upload.single('image'), (req, res) => adminUserController.createUser(req, res));

// PUT update user (with optional image upload)
router.put('/users/:id', upload.single('image'), (req, res) => adminUserController.updateUser(req, res));

// DELETE user
router.delete('/users/:id', (req, res) => adminUserController.deleteUser(req, res));

export default router;
