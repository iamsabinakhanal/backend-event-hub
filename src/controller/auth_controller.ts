import { Request, Response } from "express";
import { UserService } from "../services/user_service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import z from "zod";

export class AuthController {
    private userService = new UserService(); // service layer instance

    // ------------------- REGISTER USER -------------------
    async register(req: Request, res: Response) {
        try {
            // Validate incoming request
            const parsed = CreateUserDTO.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsed.error),
                });
            }

            const userData: CreateUserDTO = parsed.data;

            // Call service to create user
            const newUser = await this.userService.createUser(userData);

            return res.status(201).json({
                success: true,
                message: "User successfully registered for Event Hub",
                data: newUser,
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    // ------------------- LOGIN USER -------------------
    async login(req: Request, res: Response) {
        try {
            // Validate login request
            const parsed = LoginUserDTO.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsed.error),
                });
            }

            const loginData: LoginUserDTO = parsed.data;

            // Authenticate user and generate JWT
            const { token, user } = await this.userService.loginUser(loginData);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: user,
                token,
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}
