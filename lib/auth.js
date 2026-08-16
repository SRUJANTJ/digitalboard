import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { serialize, parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const COOKIE_NAME = "hnb_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearAuthCookie(res) {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function getTokenFromReq(req) {
  const cookies = parse(req.headers.cookie || "");
  return cookies[COOKIE_NAME] || null;
}

// Use in getServerSideProps and API routes to get the logged-in user (or null)
export function getUserFromReq(req) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  return verifyToken(token); // { id, username, role, department, semester, name }
}

// Wrap an API handler to require auth, optionally restricted to specific roles
export function requireAuth(handler, roles = null) {
  return async (req, res) => {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    req.user = user;
    return handler(req, res);
  };
}
