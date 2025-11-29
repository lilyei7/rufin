import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_rufin_2024';

export function verifyToken(req: NextRequest): any {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    console.error('[verifyToken] Error verifying token:', error);
    return null;
  }
}

export function isAuthenticated(req: NextRequest): boolean {
  return verifyToken(req) !== null;
}

export function getUserFromToken(req: NextRequest) {
  return verifyToken(req);
}
