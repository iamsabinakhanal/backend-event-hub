import { UserService } from "../services/user_service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import { Request, Response } from "express";
import z from "zod";
import { UserRepository } from "../repository/user_repository";
import bcryptjs from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";
import { toPublicUploadUrl } from "../utils/file";

let userService = new UserService();
let userRepository = new UserRepository();

export class AuthController {
    private getUploadedImageFile(req: Request): Express.Multer.File | undefined {
        const directFile = req.file as Express.Multer.File | undefined;
        if (directFile) {
            return directFile;
        }

        const files = req.files as
            | { [fieldname: string]: Express.Multer.File[] }
            | Express.Multer.File[]
            | undefined;

        if (!files) {
            return undefined;
        }

        if (Array.isArray(files)) {
            return files.find((file) => file.mimetype?.startsWith("image/")) ?? files[0];
        }

        return (
            files.photo?.[0] ??
            files.image?.[0] ??
            files.profilePicture?.[0] ??
            files.profile_image?.[0] ??
            files.avatar?.[0]
        );
    }

    private sanitizeUser(user: any) {
        const userObj = user?.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        delete userObj.resetToken;
        delete userObj.resetTokenExpiry;

        if (userObj.image) {
            userObj.image = toPublicUploadUrl(userObj.image);
        }

        return userObj;
    }

    private deleteFileIfExists(filePath?: string) {
        if (!filePath) {
            return;
        }
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error("[AuthController.deleteFileIfExists] error", err);
        }
    }

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
                { success: true, message: "User Created", data: this.sanitizeUser(newUser) }
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
            
            // Set token as cookie
            res.cookie('auth_token', token, { httpOnly: true });
            
            // Remove sensitive data from response
            const userObj = this.sanitizeUser(user);
            
            // Return JSON response with token and user data
            return res.status(200).json({
                success: true,
                message: "Login successful",
                token: token,
                data: userObj
            });

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
            const uploadedFile = this.getUploadedImageFile(req);

            // Users can only update their own profile (unless they're admin)
            if (authUser?.id !== id && authUser?.role !== 'admin') {
                this.deleteFileIfExists(uploadedFile?.path);
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own profile"
                });
            }

            // Check if user exists
            const existingUser = await userRepository.getUserById(id);
            if (!existingUser) {
                this.deleteFileIfExists(uploadedFile?.path);
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
                    this.deleteFileIfExists(uploadedFile?.path);
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists"
                    });
                }
            }

            // Handle image upload
            if (uploadedFile) {
                // Delete old image if it exists
                if (existingUser.image) {
                    this.deleteFileIfExists(existingUser.image);
                }
                updateData.image = uploadedFile.path.replace(/\\/g, "/");
            }

            const updatedUser = await userRepository.updateUser(id, updateData);

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: "Failed to update profile"
                });
            }

            // Remove password from response
            const userObj = this.sanitizeUser(updatedUser);

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AuthController.updateProfile] error", error);
            
            // Delete uploaded file on error
            this.deleteFileIfExists(this.getUploadedImageFile(req)?.path);

            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // POST /api/auth/admin/create - Create admin user (admin only)
    async createAdmin(req: Request, res: Response) {
        try {
            const authUser = (req as AuthRequest).user;

            // Check if requesting user is an admin
            if (!authUser || authUser.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Only admins can create admin users"
                });
            }

            const parsedData = CreateUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }

            const userData: CreateUserDTO = parsedData.data;
            const { email, firstName, lastName } = userData;
            console.log("[AuthController.createAdmin] incoming", { email, firstName, lastName });

            // Check if email already exists
            const emailCheck = await userRepository.getUserByEmail(userData.email.trim().toLowerCase());
            if (emailCheck) {
                return res.status(409).json(
                    { success: false, message: "Email already exists" }
                );
            }

            // Hash password
            const hashedPassword = await bcryptjs.hash(userData.password, 10);

            const newUser = await userRepository.createUser({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email.trim().toLowerCase(),
                password: hashedPassword,
                role: 'admin' // Set role to admin
            });

            // Remove password from response
            const userObj = this.sanitizeUser(newUser);

            return res.status(201).json(
                { success: true, message: "Admin user created successfully", data: userObj }
            );
        } catch (error: Error | any) {
            console.error("[AuthController.createAdmin] error", error);
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    // GET /api/auth/whoami - Get current authenticated user
    async whoami(req: Request, res: Response) {
        try {
            const authUser = (req as AuthRequest).user;

            if (!authUser) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const user = await userRepository.getUserById(authUser.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Remove password from response
            const userObj = this.sanitizeUser(user);

            return res.status(200).json({
                success: true,
                data: userObj
            });
        } catch (error: Error | any) {
            console.error("[AuthController.whoami] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // PUT /api/auth/update-profile - Update current user's profile
    async updateCurrentProfile(req: Request, res: Response) {
        try {
            const authUser = (req as AuthRequest).user;
            const uploadedFile = this.getUploadedImageFile(req);

            if (!authUser) {
                this.deleteFileIfExists(uploadedFile?.path);
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const userId = authUser.id;

            // Check if user exists
            const existingUser = await userRepository.getUserById(userId);
            if (!existingUser) {
                this.deleteFileIfExists(uploadedFile?.path);
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
                if (emailExists && emailExists._id.toString() !== userId) {
                    this.deleteFileIfExists(uploadedFile?.path);
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists"
                    });
                }
            }

            // Handle image upload
            if (uploadedFile) {
                // Delete old image if it exists
                if (existingUser.image) {
                    this.deleteFileIfExists(existingUser.image);
                }
                updateData.image = uploadedFile.path.replace(/\\/g, "/");
            }

            const updatedUser = await userRepository.updateUser(userId, updateData);

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: "Failed to update profile"
                });
            }

            // Remove password from response
            const userObj = this.sanitizeUser(updatedUser);

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: userObj
            });
        } catch (error: any) {
            console.error("[AuthController.updateCurrentProfile] error", error);
            
            // Delete uploaded file on error
            this.deleteFileIfExists(this.getUploadedImageFile(req)?.path);

            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // GET /api/auth/profile - alias for whoami used by profile page
    async getProfile(req: Request, res: Response) {
        return this.whoami(req, res);
    }

    // PUT /api/auth/profile - edit profile data and optional image
    async updateProfilePage(req: Request, res: Response) {
        return this.updateCurrentProfile(req, res);
    }

    // PATCH /api/auth/profile/photo - update only profile photo
    async updateProfilePhoto(req: Request, res: Response) {
        const uploadedFile = this.getUploadedImageFile(req);
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                message: "Profile photo is required (send file as photo, image, profilePicture, profile_image, or avatar)"
            });
        }

        return this.updateCurrentProfile(req, res);
    }

    // POST /api/auth/request-password-reset - Request password reset
    async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email is required"
                });
            }

            const user = await userRepository.getUserByEmail(email.trim().toLowerCase());
            
            // Don't reveal if user exists or not for security reasons
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: "If your email exists in our system, you will receive a password reset link"
                });
            }

            // Generate reset token
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Save reset token to user
            await userRepository.updateUser(user._id.toString(), {
                resetToken,
                resetTokenExpiry
            });

            // TODO: Send email with reset link
            // For now, we'll just log it
            console.log(`[AuthController.requestPasswordReset] Reset token for ${email}: ${resetToken}`);
            console.log(`Reset link: http://localhost:3003/reset-password?token=${resetToken}`);

            return res.status(200).json({
                success: true,
                message: "If your email exists in our system, you will receive a password reset link"
            });
        } catch (error: Error | any) {
            console.error("[AuthController.requestPasswordReset] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    // POST /api/auth/reset-password/:token - Reset password with token
    async resetPassword(req: Request, res: Response) {
        try {
            const { token } = req.params;
            const { newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Token and new password are required"
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            // Find user with valid reset token
            const user = await userRepository.getUserByResetToken(token);

            if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token"
                });
            }

            // Hash new password
            const hashedPassword = await bcryptjs.hash(newPassword, 10);

            // Update user's password and clear reset token
            await userRepository.updateUser(user._id.toString(), {
                password: hashedPassword,
                resetToken: undefined,
                resetTokenExpiry: undefined
            });

            return res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } catch (error: Error | any) {
            console.error("[AuthController.resetPassword] error", error);
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
    
}