import { UserService } from "../services/user_service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import { Request, Response } from "express";
import z from "zod";
let userService = new UserService();
export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); 
            if (!parsedData.success) {
                const errorMessage = parsedData.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
                return res.status(400).json(
                    { success: false, message: errorMessage }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.createUser(userData);
            return res.status(201).json(
                { success: true, message: "User Created", data: newUser }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                const errorMessage = parsedData.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
                return res.status(400).json(
                    { success: false, message: errorMessage }
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
    
}