import { Request, Response, NextFunction } from "express";
import { db, userSessionsTable, usersTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  const token = header.slice(7);
  try {
    const [session] = await db
      .select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.token, token))
      .limit(1);
    if (session && session.expiresAt > new Date()) {
      const [user] = await db
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, session.userId))
        .limit(1);
      if (user) {
        req.userId = user.id;
        req.userRole = user.role;
      }
    }
  } catch {
    // ignore auth errors for optional auth
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  await optionalAuth(req, res, () => {
    if (!req.userId) {
      res.status(401).json({ error: "Yetkisiz erişim." });
      return;
    }
    next();
  });
}
