/**
 * AuthContext.jsx
 *
 * Provides the logged-in user and auth state to the entire application.
 *
 * What it does:
 * - On app load, checks if a token exists in localStorage and fetches the user profile.
 * - Provides login(), logout(), and register() functions to any component.
 * - Provides the current user object and a loading flag.
 *
 * React concept: Context + useReducer for predictable state updates.
 */

import { createContext, useContext, useReducer, useEffect } from "react";
import authApi from "../api/auth";

// ── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  user: null,        // The logged-in user object from the backend
  token: null,       // JWT string
  isLoading: true,   // True while we're checking localStorage on first load
};

// ── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case "LOGOUT":
      return { ...state, user: null, token: null, isLoading: false };
    case "DONE_LOADING":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On first render, check if there's an existing token in localStorage.
  // If yes, fetch the user profile to restore the session.
  useEffect(() => {
    const token = localStorage.getItem("apiShield_token");

    if (!token) {
      // No token — user is not logged in
      dispatch({ type: "DONE_LOADING" });
      return;
    }

    // Try to restore the session by fetching the profile
    authApi.getProfile()
      .then((response) => {
        dispatch({
          type: "SET_USER",
          payload: { user: response.data.data, token },
        });
      })
      .catch(() => {
        // Token was invalid or expired — clear it
        localStorage.removeItem("apiShield_token");
        dispatch({ type: "DONE_LOADING" });
      });
  }, []);

  // Login function: calls the backend, stores the token, updates state
  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const { token, data: user } = response.data;
    // Store the token so it persists across page refreshes
    localStorage.setItem("apiShield_token", token);
    dispatch({ type: "SET_USER", payload: { user, token } });
    return user;
  };

  // Register function: creates account, then auto-logs in
  const register = async (name, email, password) => {
    await authApi.register(name, email, password);
    // After registration, log the user in immediately
    return login(email, password);
  };

  // Logout: clear token from localStorage and reset state
  const logout = () => {
    localStorage.removeItem("apiShield_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook ──────────────────────────────────────────────────────────────
// Makes it easy to use auth in any component: const { user, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
