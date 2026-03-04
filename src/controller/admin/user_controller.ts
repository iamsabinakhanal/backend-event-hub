import { Request, Response } from "express";
import { AdminUserService } from "../../services/admin/user_service";
import { CreateUserDTO, UpdateUserDTO } from "../../dtos/user_dtos";
import z from "zod";
import { AuthRequest } from "../../middleware/auth";
import { UserModel } from "../../models/user_model";
import { BookingModel } from "../../models/booking_model";
import { ServiceModel } from "../../models/service_model";
import { ContactModel } from "../../models/contact_model";

const adminUserService = new AdminUserService();

export class AdminUserController {
    // GET /api/admin/dashboard - Get dashboard statistics
    async getDashboard(req: Request, res: Response) {
        try {
            // Get counts for different entities
            const totalUsers = await UserModel.countDocuments();
            const totalBookings = await BookingModel.countDocuments();
            const totalServices = await ServiceModel.countDocuments();
            const totalContacts = await ContactModel.countDocuments();

            // Get booking statistics by status
            const bookingsByStatus = await BookingModel.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get recent bookings
            const recentBookings = await BookingModel.find()
                .populate('user_id', 'firstName lastName email')
                .populate('service_id', 'name price')
                .sort({ createdAt: -1 })
                .limit(5);

            // Get revenue statistics
            const revenueStats = await BookingModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$total_price" },
                        avgBookingValue: { $avg: "$total_price" }
                    }
                }
            ]);

            return res.status(200).json({
                success: true,
                message: "Dashboard data retrieved successfully",
                data: {
                    stats: {
                        totalUsers,
                        totalBookings,
                        totalServices,
                        totalContacts
                    },
                    bookingsByStatus,
                    recentBookings,
                    revenue: revenueStats[0] || { totalRevenue: 0, avgBookingValue: 0 }
                }
            });
        } catch (error: any) {
            console.error("[AdminUserController.getDashboard] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // GET /api/admin/ - Get all users
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await adminUserService.getAllUsers();

            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: users
            });
        } catch (error: any) {
            console.error("[AdminUserController.getAllUsers] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // GET /api/admin/:id - Get user by ID
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const user = await adminUserService.getUserById(id);

            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user
            });
        } catch (error: any) {
            console.error("[AdminUserController.getUserById] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // POST /api/admin/ - Create new user (with image upload)
    async createUser(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body);
            
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const userData = parsedData.data;
            const imagePath = req.file?.path;

            const newUser = await adminUserService.createUser(userData);

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: newUser
            });
        } catch (error: any) {
            console.error("[AdminUserController.createUser] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // PUT /api/admin/:id - Update user (with image upload)
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const imagePath = req.file?.path;

            const parsedData = UpdateUserDTO.safeParse(req.body);
            
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const updateData = parsedData.data;
            const updatedUser = await adminUserService.updateUser(id, updateData);

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser
            });
        } catch (error: any) {
            console.error("[AdminUserController.updateUser] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // DELETE /api/admin/:id - Delete user
    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const deleted = await adminUserService.deleteUser(id);

            return res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });
        } catch (error: any) {
            console.error("[AdminUserController.deleteUser] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // PUT /api/admin/:id/role - Change user role
    async changeUserRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            // const updatedUser = await adminUserService.changeUserRole(id, role);

            return res.status(200).json({
                success: true,
                message: `User role changed to ${role}`,
                // data: updatedUser
            });
        } catch (error: any) {
            console.error("[AdminUserController.changeUserRole] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}
