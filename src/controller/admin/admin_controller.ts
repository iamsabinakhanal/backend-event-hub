import { Request, Response } from "express";
import { UserRepository } from "../../repository/user_repository";
import { CreateUserDTO } from "../../dtos/user_dtos";
import z from "zod";
import bcryptjs from "bcryptjs";
import { HttpError } from "../../errors/http-errors";
import { AuthRequest } from "../../middleware/auth";
import path from "path";
import fs from "fs";

const userRepository = new UserRepository();

export class AdminUserController {
    // GET /api/admin/users - Get all users
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userRepository.getAllUsers();
            
            // Remove password from response
            const usersWithoutPassword = users.map(user => {
                const userObj = user.toObject();
                delete userObj.password;
                return userObj;
            });

            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: usersWithoutPassword
            });
        } catch (error: any) {
            console.error("[AdminUserController.getAllUsers] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // GET /api/admin/users/:id - Get user by ID
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const user = await userRepository.getUserById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Remove password from response
            const userObj = user.toObject();
            delete userObj.password;

            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AdminUserController.getUserById] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // POST /api/admin/users - Create new user (with image upload)
    async createUser(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body);
            
            if (!parsedData.success) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const userData = parsedData.data;
            const normalizedEmail = userData.email.trim().toLowerCase();

            // Check if email already exists
            const existingUser = await userRepository.getUserByEmail(normalizedEmail);
            if (existingUser) {
                // Delete uploaded file if user already exists
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(409).json({
                    success: false,
                    message: "Email already exists"
                });
            }

            // Hash password
            const hashedPassword = await bcryptjs.hash(userData.password, 10);

            // Remove confirmPassword before saving
            const { confirmPassword, ...userDataToSave } = userData;
            userDataToSave.password = hashedPassword;
            userDataToSave.email = normalizedEmail;

            // Add image path if file was uploaded
            const newUserData: any = { ...userDataToSave };
            if (req.file) {
                newUserData.image = req.file.path;
            }

            const newUser = await userRepository.createUser(newUserData);

            // Remove password from response
            const userObj = newUser.toObject();
            delete userObj.password;

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AdminUserController.createUser] error", error);
            
            // Delete uploaded file on error
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // PUT /api/admin/users/:id - Update user (with image upload)
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            // Check if user exists
            const existingUser = await userRepository.getUserById(id);
            if (!existingUser) {
                // Delete uploaded file if user doesn't exist
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const updateData: any = { ...req.body };

            // Hash password if it's being updated
            if (updateData.password) {
                updateData.password = await bcryptjs.hash(updateData.password, 10);
            }

            // Normalize email if it's being updated
            if (updateData.email) {
                updateData.email = updateData.email.trim().toLowerCase();
                
                // Check if new email already exists (for other users)
                const emailExists = await userRepository.getUserByEmail(updateData.email);
                if (emailExists && emailExists._id.toString() !== id) {
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists"
                    });
                }
            }

            // Handle image upload
            if (req.file) {
                // Delete old image if it exists
                if (existingUser.image) {
                    try {
                        fs.unlinkSync(existingUser.image);
                    } catch (err) {
                        console.error("Error deleting old image:", err);
                    }
                }
                updateData.image = req.file.path;
            }

            const updatedUser = await userRepository.updateUser(id, updateData);

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: "Failed to update user"
                });
            }

            // Remove password from response
            const userObj = updatedUser.toObject();
            delete userObj.password;

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AdminUserController.updateUser] error", error);
            
            // Delete uploaded file on error
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // DELETE /api/admin/users/:id - Delete user
    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            // Get user before deleting to access image path
            const user = await userRepository.getUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Delete user's image if it exists
            if (user.image) {
                try {
                    fs.unlinkSync(user.image);
                } catch (err) {
                    console.error("Error deleting user image:", err);
                }
            }

            const deleted = await userRepository.deleteUser(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Failed to delete user"
                });
            }

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
}
