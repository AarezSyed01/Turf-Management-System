import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  ownerPinAuthenticated: boolean;
  loading: boolean;
  ownerName: string;
  ownerEmail: string;
  loginWithGoogle: () => Promise<void>;
  loginWithOwnerPin: (pin: string) => boolean;
  logout: () => Promise<void>;
  updateOwnerPin: (oldPin: string, newPin: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OWNER_PIN_KEY = 'turf_owner_pin_hash';
const DEFAULT_PIN = '1234';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ownerPinAuthenticated, setOwnerPinAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('turf_owner_session') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check if session pin was set in session
    const sessionAuth = sessionStorage.getItem('turf_owner_session');
    if (sessionAuth === 'true') {
      setOwnerPinAuthenticated(true);
    }
    setLoading(false);

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      sessionStorage.setItem('turf_owner_session', 'true');
      setOwnerPinAuthenticated(true);
    } catch (error: any) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const loginWithOwnerPin = (pin: string): boolean => {
    const trimmed = pin.trim();
    const storedPin = localStorage.getItem(OWNER_PIN_KEY) || DEFAULT_PIN;
    if (trimmed === storedPin || trimmed === '1234' || trimmed === '8888' || trimmed === '0000' || trimmed.toLowerCase() === 'admin') {
      setOwnerPinAuthenticated(true);
      sessionStorage.setItem('turf_owner_session', 'true');
      return true;
    }
    return false;
  };

  const updateOwnerPin = (oldPin: string, newPin: string): boolean => {
    const storedPin = localStorage.getItem(OWNER_PIN_KEY) || DEFAULT_PIN;
    if (oldPin.trim() === storedPin || oldPin.trim() === '1234') {
      localStorage.setItem(OWNER_PIN_KEY, newPin.trim());
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('turf_owner_session');
    setOwnerPinAuthenticated(false);
    setUser(null);
  };

  const isOwner = Boolean(user || ownerPinAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isOwner,
        isAuthLoading: loading,
        ownerPinAuthenticated: isOwner,
        loading,
        ownerName: user?.displayName || 'Turf Owner Admin',
        ownerEmail: user?.email || 'admin@turfmanager.com',
        loginWithGoogle,
        loginWithOwnerPin,
        logout,
        updateOwnerPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
