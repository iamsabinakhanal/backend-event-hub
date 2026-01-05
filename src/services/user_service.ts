// src/services/user.service.ts

import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos"; // ensure file is named user.dto.ts
import { UserRepository } from "../repository/user_repository"; // ensure file is named user.repository.ts
import * as bcrypt from "bcryptjs"; // TS-safe import
import jwt from "jsonwebtoken"; // Fixed: default import instead of namespace
import { HttpError } from "../errors/http-errors"; // ensure file is named http-error.ts
import { JWT_SECRET } from "../config"; // from config.ts
import { SignOptions } from "jsonwebtoken"; // Add SignOptions import

export class UserService {
    private userRepository = new UserRepository(); // decoupled repository

    // ------------------- REGISTER USER -------------------
    async createUser(data: CreateUserDTO) {
        // 1️⃣ Check if email already exists
        const emailExists = await this.userRepository.getUserByEmail(data.email);
        if (emailExists) throw new HttpError(403, "Email already in use");

        // 2️⃣ Check if username already exists
        const usernameExists = await this.userRepository.getUserByUsername(data.username);
        if (usernameExists) throw new HttpError(403, "Username already in use");

        // 3️⃣ Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 4️⃣ Map DTO to repository/UserModel type
        const userToSave = {
            email: data.email,
            username: data.username,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role || "user", // default to "user"
        };

        // 5️⃣ Save user
        const newUser = await this.userRepository.createUser(userToSave);
        return newUser;
    }

    // ------------------- LOGIN USER -------------------
    async loginUser(data: LoginUserDTO) {
        // 1️⃣ Find user by email
        const user = await this.userRepository.getUserByEmail(data.email);
        if (!user) throw new HttpError(404, "User not found");

        // 2️⃣ Compare passwords
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) throw new HttpError(401, "Invalid credentials");

        // 3️⃣ Generate JWT token
        const payload = {
            id: user._id.toString(), // convert MongoDB ObjectId to string
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };

        const signOptions: SignOptions = {
            expiresIn: process.env.JWT_EXPIRES_IN || "30d" as any
        };

        const token = jwt.sign(payload, JWT_SECRET || "default_secret", signOptions);

        // 4️⃣ Return token + user
        return { token, user };
    }
}
