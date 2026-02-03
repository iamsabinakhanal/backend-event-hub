import { UserService } from "../services/user_service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import { Request, Response } from "express";
import z from "zod";
import { UserRepository } from "../repository/user_repository";
import bcryptjs from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";

let userService = new UserService();
let userRepository = new UserRepository();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); // validate request body
            if (!parsedData.success) { // validation failed
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const { email, firstName, lastName } = userData;
            console.log("[AuthController.register] incoming", { email, firstName, lastName });
            const newUser = await userService.createUser(userData);
            return res.status(201).json(
                { success: true, message: "User Created", data: newUser }
            );
        } catch (error: Error | any) { // exception handling
            console.error("[AuthController.register] error", {
                message: error?.message,
                code: error?.code,
                keyValue: error?.keyValue,
                keyPattern: error?.keyPattern,
                stack: error?.stack
            });
            // Handle MongoDB duplicate key error
            if (error.code === 11000 || error.code === 11001) {
                return res.status(409).json(
                    { success: false, message: "Email already exists" }
                );
            }
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, user } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful", data: user, token }
            );

        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    // PUT /api/auth/:id - Update user profile (with optional image upload)
    async updateProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authUser = (req as AuthRequest).user;

            // Users can only update their own profile (unless they're admin)
            if (authUser?.id !== id && authUser?.role !== 'admin') {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own profile"
                });
            }

            // Check if user exists
            const existingUser = await userRepository.getUserById(id);
            if (!existingUser) {
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
                
                // Check if new email already exists
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
                    message: "Failed to update profile"
                });
            }

            // Remove password from response
            const userObj = updatedUser.toObject();
            delete userObj.password;

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AuthController.updateProfile] error", error);
            
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
    
}