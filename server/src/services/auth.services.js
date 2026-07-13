import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

class AuthService {
    async register(userData){
        const {email} = userData;

        const existingUser = await User.findOne({email});

        if(existingUser){
            throw new Error("User already exists with this email");
        }

        const user = await User.create(userData);
        return user;
    }

    async login(loginData){
        const {email,password} = loginData;

        const user = await User.findOne({email}).select("+password");

        if(!user){
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await user.comparePassword(password);

        if(!isPasswordValid){
            throw new Error ("Invalid email or password");
        }

        const token = jwt.sign(
            {
                userId : user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn : process.env.JWT_EXPIRES_IN
            }
        )

        user.password = undefined;

        return {
            user,
            token
        }
    }
}

const authService = new AuthService();

export default authService;
