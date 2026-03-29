import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Express middleware: sets req.user from cookie or Authorization Bearer */
export function authOptional(req, res, next) {
  const cookie = req.cookies?.token;
  const header = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = cookie || header;
  const decoded = verifyToken(token);
  req.user = decoded;
  next();
}

export function requireAuth(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user?.sub) {
      return res.status(401).json({ error: "Login required" });
    }
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    next();
  });
}
