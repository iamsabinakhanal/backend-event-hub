import { CreateUserDTO, UpdateUserDTO } from "../../dtos/user_dtos";
import { UserRepository } from "../../repository/user_repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../../errors/http-errors";
import fs from "fs";

let userRepository = new UserRepository();

export class AdminUserService {
    async createUser(data: CreateUserDTO, imagePath?: string) {
        const emailCheck = await userRepository.getUserByEmail(data.email.trim().toLowerCase());
        if (emailCheck) {
            // Delete uploaded file if email already exists
            if (imagePath) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (err) {
                    console.error("Error deleting image:", err);
                }
            }
            throw new HttpError(409, "Email already in use");
        }
        
        // Hash password
        const hashedPassword = await bcryptjs.hash(data.password, 10);
        
        const userData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email.trim().toLowerCase(),
            password: hashedPassword
        };

        // Add image path if uploaded
        if (imagePath) {
            userData.image = imagePath;
        }

        const newUser = await userRepository.createUser(userData);
        
        // Remove password from response
        const userObj = newUser.toObject();
        delete userObj.password;
        
        return userObj;
    }

    async getAllUsers() {
        const users = await userRepository.getAllUsers();
        
        // Remove password from all users
        return users.map(user => {
            const userObj = user.toObject();
            delete userObj.password;
            return userObj;
        });
    }

    async getAllUsersPaginated({ 
        page, 
        size, 
        search 
    }: { 
        page?: string | undefined; 
        size?: string | undefined; 
        search?: string | undefined;
    }) {
        const currentPage = page ? parseInt(page) : 1;
        const currentSize = size ? parseInt(size) : 10;
        const currentSearch = search || "";
        
        // Validate pagination params
        if (currentPage < 1) {
            throw new HttpError(400, "Page must be greater than 0");
        }
        if (currentSize < 1 || currentSize > 100) {
            throw new HttpError(400, "Page size must be between 1 and 100");
        }

        const users = await userRepository.getAllUsers();
        
        // Filter by search
        let filteredUsers = users;
        if (currentSearch.trim()) {
            filteredUsers = users.filter(user => 
                user.email.includes(currentSearch) ||
                user.firstName?.includes(currentSearch) ||
                user.lastName?.includes(currentSearch)
            );
        }

        const totalUsers = filteredUsers.length;
        const startIndex = (currentPage - 1) * currentSize;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + currentSize);

        // Remove password from all users
        const usersWithoutPassword = paginatedUsers.map(user => {
            const userObj = user.toObject();
            delete userObj.password;
            return userObj;
        });

        const pagination = {
            page: currentPage,
            size: currentSize,
            total: totalUsers,
            totalPages: Math.ceil(totalUsers / currentSize),
        };

        return { users: usersWithoutPassword, pagination };
    }

    async deleteUser(id: string) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
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
        return deleted;
    }

    async updateUser(id: string, updateData: UpdateUserDTO, imagePath?: string) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            // Delete uploaded file if user doesn't exist
            if (imagePath) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (err) {
                    console.error("Error deleting image:", err);
                }
            }
            throw new HttpError(404, "User not found");
        }

        const dataToUpdate: any = { ...updateData };

        // Hash password if it's being updated
        if (dataToUpdate.password) {
            dataToUpdate.password = await bcryptjs.hash(dataToUpdate.password, 10);
        }

        // Normalize and check email if it's being updated
        if (dataToUpdate.email) {
            dataToUpdate.email = dataToUpdate.email.trim().toLowerCase();
            
            const emailExists = await userRepository.getUserByEmail(dataToUpdate.email);
            if (emailExists && emailExists._id.toString() !== id) {
                if (imagePath) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch (err) {
                        console.error("Error deleting image:", err);
                    }
                }
                throw new HttpError(409, "Email already in use");
            }
        }

        // Handle image upload
        if (imagePath) {
            // Delete old image if it exists
            if (user.image) {
                try {
                    fs.unlinkSync(user.image);
                } catch (err) {
                    console.error("Error deleting old image:", err);
                }
            }
            dataToUpdate.image = imagePath;
        }

        const updatedUser = await userRepository.updateUser(id, dataToUpdate);
        
        if (!updatedUser) {
            throw new HttpError(500, "Failed to update user");
        }

        // Remove password from response
        const userObj = updatedUser.toObject();
        delete userObj.password;
        
        return userObj;
    }

    async getUserById(id: string) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // Remove password from response
        const userObj = user.toObject();
        delete userObj.password;
        
        return userObj;
    }

    async changeUserRole(id: string, role: "user" | "admin") {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        if (!["user", "admin"].includes(role)) {
            throw new HttpError(400, "Invalid role. Must be 'user' or 'admin'");
        }

        const updatedUser = await userRepository.updateUser(id, { role });

        if (!updatedUser) {
            throw new HttpError(500, "Failed to update user role");
        }

        // Remove password from response
        const userObj = updatedUser.toObject();
        delete userObj.password;
        
        return userObj;
    }
}
