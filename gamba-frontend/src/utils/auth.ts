import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload {
  role?: string;
  user_id: string;
  exp: number;
}

export const isAdmin = (): boolean => {
  const token = localStorage.getItem("access");
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);
    return decoded.role === "admin" && decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};