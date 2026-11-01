import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import authApi from "../api/auth";
import { setStoredAccessToken, getStoredAccessToken } from "../api/axiosInstance";

const initialState = {
  user: null,
  token: null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
      };
    case "DONE_LOADING":
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authenticated session on mount using stored token or HTTP-only cookie refresh
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const existingToken = getStoredAccessToken();

      // 1. If we have a stored access token, try getProfile first
      if (existingToken) {
        try {
          const profileRes = await authApi.getProfile();
          if (isMounted) {
            dispatch({
              type: "SET_USER",
              payload: { user: profileRes.data.data, token: existingToken },
            });
            return;
          }
        } catch {
          // Access token might be expired, proceed to refresh attempt
        }
      }

      // 2. Try refreshing using the HTTP-only cookie
      try {
        const refreshRes = await authApi.refreshToken();
        const newAccessToken =
          refreshRes.data?.accessToken ||
          refreshRes.data?.token ||
          refreshRes.data?.data?.accessToken;

        if (newAccessToken) {
          setStoredAccessToken(newAccessToken);
          const profileRes = await authApi.getProfile();
          if (isMounted) {
            dispatch({
              type: "SET_USER",
              payload: { user: profileRes.data.data, token: newAccessToken },
            });
            return;
          }
        }
      } catch {
        // No valid session / cookie
        setStoredAccessToken(null);
      }

      if (isMounted) {
        dispatch({ type: "DONE_LOADING" });
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const token = response.data?.accessToken || response.data?.token;
    const user = response.data?.data || response.data?.user;

    setStoredAccessToken(token);
    dispatch({ type: "SET_USER", payload: { user, token } });
    return user;
  };

  // Called after completing Google OAuth callback flow to commit state
  const setAuthSession = useCallback((user, token) => {
    setStoredAccessToken(token);
    dispatch({ type: "SET_USER", payload: { user, token } });
  }, []);

  const register = async (name, email, password) => {
    const response = await authApi.register(name, email, password);
    return response.data;
  };

  const updateUser = (updatedUserData) => {
    dispatch({ type: "UPDATE_USER", payload: updatedUserData });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Backend logout errors handled gracefully
    } finally {
      setStoredAccessToken(null);
      dispatch({ type: "LOGOUT" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        updateUser,
        setAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
