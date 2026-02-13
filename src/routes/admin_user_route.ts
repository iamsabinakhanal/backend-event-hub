import { Router } from "express";
import { authMiddleware as authorizedMiddleware, adminMiddleware as adminOnlyMiddleware } from "../middleware/auth";
import { AdminUserController } from "../controller/admin/user_controller";
import { upload as uploads } from "../config/multer";

let adminUserController = new AdminUserController();

const router = Router();

router.use(authorizedMiddleware);
router.use(adminOnlyMiddleware);

router.post("/", uploads.single("image"), (req, res) => adminUserController.createUser(req, res));
router.get("/", (req, res) => adminUserController.getAllUsers(req, res));
router.put("/:id", uploads.single("image"), (req, res) => adminUserController.updateUser(req, res));
router.delete("/:id", (req, res) => adminUserController.deleteUser(req, res));
router.get("/:id", (req, res) => adminUserController.getUserById(req, res));
router.put("/:id/role", (req, res) => adminUserController.changeUserRole(req, res));

export default router;
