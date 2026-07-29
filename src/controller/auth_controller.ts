import { UserService } from "../services/user_service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user_dtos";
import { Request, Response } from "express";
import z from "zod";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, JWT_SECRET } from "../config";
let userService = new UserService();
const oauthHandoffs = new Map<string, { token: string; expiresAt: number }>();
export class AuthController {
    private userId(req: Request) {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) throw new Error("Authentication required");
        const payload = jwt.verify(header.slice(7), JWT_SECRET) as { id: string };
        return payload.id;
    }

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
                { success: true, message: "Account created. A verification code has been sent to your email.", data: newUser }
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

    async verifyEmail(req: Request, res: Response) {
        try {
            const parsed = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
            if (!parsed.success) return res.status(400).json({ success: false, message: "A valid email and six-digit code are required" });
            const result = await userService.verifyEmail(parsed.data.email, parsed.data.code);
            return res.status(200).json({ success: true, message: result.message, data: result });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 401).json({ success: false, message: error.message || "Verification failed" });
        }
    }

    async beginTotp(req: Request, res: Response) {
        try { return res.status(200).json({ success: true, data: await userService.createTotpSecret(this.userId(req)) }); }
        catch (error: Error | any) { return res.status(error.statusCode ?? 401).json({ success: false, message: error.message }); }
    }

    async verifyTotp(req: Request, res: Response) {
        try {
            const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
            if (!parsed.success) return res.status(400).json({ success: false, message: "A six-digit code is required" });
            return res.status(200).json({ success: true, data: await userService.verifyTotp(this.userId(req), parsed.data.code) });
        } catch (error: Error | any) { return res.status(error.statusCode ?? 401).json({ success: false, message: error.message }); }
    }

    async googleStart(req: Request, res: Response) {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(503).json({ success: false, message: "Google OAuth is not configured" });
        const state = crypto.randomBytes(32).toString("hex");
        res.setHeader("Set-Cookie", `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth/oauth; Max-Age=600${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
        const params = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: "code", scope: "openid email profile", state });
        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    }

    async googleCallback(req: Request, res: Response) {
        try {
            const stateCookie = req.headers.cookie?.match(/(?:^|; )oauth_state=([^;]+)/)?.[1];
            if (!stateCookie || !req.query.state || stateCookie !== req.query.state) return res.status(400).send("Invalid OAuth state");
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code: String(req.query.code), client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
            if (!tokenResponse.ok) return res.status(401).send("Google authorization failed");
            const tokens = await tokenResponse.json() as { access_token?: string };
            const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
            if (!profileResponse.ok) return res.status(401).send("Google profile lookup failed");
            const profile = await profileResponse.json() as { sub: string; email: string; given_name?: string; family_name?: string };
            const result = await userService.loginWithGoogle(profile);
            res.setHeader("Set-Cookie", `oauth_state=; HttpOnly; SameSite=Lax; Path=/api/auth/oauth; Max-Age=0`);
            const handoffCode = crypto.randomBytes(32).toString("hex");
            oauthHandoffs.set(handoffCode, { token: result.token, expiresAt: Date.now() + 60_000 });
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/oauth-complete?code=${encodeURIComponent(handoffCode)}`);
        } catch (error: Error | any) { return res.status(500).send(error.message || "OAuth login failed"); }
    }

    async exchangeGoogleHandoff(req: Request, res: Response) {
        const parsed = z.object({ code: z.string().length(64) }).safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid OAuth handoff" });
        const handoff = oauthHandoffs.get(parsed.data.code);
        oauthHandoffs.delete(parsed.data.code);
        if (!handoff || handoff.expiresAt < Date.now()) return res.status(401).json({ success: false, message: "Expired OAuth handoff" });
        return res.status(200).json({ success: true, token: handoff.token });
    }
    
}