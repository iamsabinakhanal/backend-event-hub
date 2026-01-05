import { UserModel, IUser } from "../models/user_model";

/**
 * IUserRepository
 * Interface defining all database operations for the User entity
 */
export interface IUserRepository {
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByUsername(username: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    getAllUsers(): Promise<IUser[]>;
    createUser(userData: Partial<IUser>): Promise<IUser>;
    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(id: string): Promise<boolean>;
}

/**
 * UserRepository
 * MongoDB implementation of IUserRepository
 */
export class UserRepository implements IUserRepository {
    // ------------------- CREATE -------------------
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        return await user.save();
    }

    // ------------------- READ -------------------
    async getUserByEmail(email: string): Promise<IUser | null> {
        return await UserModel.findOne({ email });
    }

    async getUserByUsername(username: string): Promise<IUser | null> {
        return await UserModel.findOne({ username });
    }

    async getUserById(id: string): Promise<IUser | null> {
        return await UserModel.findById(id);
    }

    async getAllUsers(): Promise<IUser[]> {
        return await UserModel.find();
    }

    // ------------------- UPDATE -------------------
    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // return the updated document
        );
    }

    // ------------------- DELETE -------------------
    async deleteUser(id: string): Promise<boolean> {
        const result = await UserModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
