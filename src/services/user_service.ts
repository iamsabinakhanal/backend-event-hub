import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import { UserRepository } from "../repository/user_repository";
import  bcryptjs from "bcryptjs"
import { HttpError } from "../errors/http-errors";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class UserService {
    async createUser(data: CreateUserDTO){
        const normalizedEmail = data.email.trim().toLowerCase();
        // business logic before creating user
        const emailCheck = await userRepository.getUserByEmail(normalizedEmail);
        if(emailCheck){
            throw new HttpError(403, "Email already in use");
        }
        // hash password
        const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 - complexity
        // Removing confirmPassword before saving to database
         const { confirmPassword, ...userData } = data;
        userData.password = hashedPassword;
        userData.email = normalizedEmail;

        // create user
        const newUser = await userRepository.createUser(userData);
        return newUser;
    }

    async loginUser(data: LoginUserDTO){
        const normalizedEmail = data.email.trim().toLowerCase();
        const user =  await userRepository.getUserByEmail(normalizedEmail);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        // compare password
        const validPassword = await bcryptjs.compare(data.password, user.password);
        // plaintext, hashed
        if(!validPassword){
            throw new HttpError(401, "Invalid credentials");
        }
        // generate jwt
        const payload = { // user identifier
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // 30 days
        return { token, user }
    }
}