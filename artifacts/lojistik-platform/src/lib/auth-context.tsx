import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { getMe, logout as apiLogout, setAuthTokenGetter } from "@workspace/api-client-react";

export type Role = "admin" | "corporate" | "driver" | "individual" | null;

export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  company?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  vehicleTypes?: string | null;
  vehiclePlate?: string | null;
  isPhoneVerified?: boolean;
  notificationSettings?: string | null;
  status?: "active" | "suspended" | "pending" | null;
  rating?: number | null;
  totalShipments?: number | null;
  createdAt?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tasiyo_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  // Wire the token into the shared fetch client so all API calls include it
  useEffect(() => {
    setAuthTokenGetter(token ? () => token : null);
  }, [token]);

  const fetchMe = useCallback(async (tok: string) => {
    try {
      const data = await getMe({
        headers: { Authorization: `Bearer ${tok}` },
      });
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as Role,
        company: data.company,
        avatarUrl: data.avatarUrl,
        website: data.website,
        address: data.address,
        taxNumber: data.taxNumber,
        vehicleTypes: data.vehicleTypes,
        vehiclePlate: (data as { vehiclePlate?: string }).vehiclePlate,
        isPhoneVerified: (data as { isPhoneVerified?: boolean }).isPhoneVerified ?? false,
        notificationSettings: data.notificationSettings,
        status: (data as { status?: "active" | "suspended" | "pending" }).status,
        rating: (data as { rating?: number }).rating ?? null,
        totalShipments: (data as { totalShipments?: number }).totalShipments ?? null,
        createdAt: (data as { createdAt?: string }).createdAt ?? null,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token, fetchMe]);

  const setToken = useCallback((tok: string) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setTokenState(tok);
    fetchMe(tok);
  }, [fetchMe]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiLogout({ headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (token) await fetchMe(token);
  }, [token, fetchMe]);

  const role: Role =
    user?.role === "individual" || user?.role === "driver" ? "driver" : (user?.role ?? null);

  return (
    <AuthContext.Provider value={{ user, role, token, isLoading, setToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
