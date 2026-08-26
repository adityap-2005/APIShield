import { createContext, useContext, useReducer, useEffect } from "react";
import authApi from "../api/auth";

const initialState = {
  user: null,
  token: null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "LOGOUT":
      return { ...state, user: null, token: null, isLoading: false };
    case "DONE_LOADING":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authenticated session on mount if token is present in storage
  useEffect(() => {
    const token = localStorage.getItem("apiShield_token");

    if (!token) {
      dispatch({ type: "DONE_LOADING" });
      return;
    }

    authApi.getProfile()
      .then((response) => {
        dispatch({
          type: "SET_USER",
          payload: { user: response.data.data, token },
        });
      })
      .catch(() => {
        // Clear invalid or expired token to prevent infinite auth loop
        localStorage.removeItem("apiShield_token");
        dispatch({ type: "DONE_LOADING" });
      });
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const { token, data: user } = response.data;
    localStorage.setItem("apiShield_token", token);
    dispatch({ type: "SET_USER", payload: { user, token } });
    return user;
  };

  // Register calls ONLY the registration API. Does not automatically log in.
  const register = async (name, email, password) => {
    const response = await authApi.register(name, email, password);
    return response.data;
  };

  const updateUser = (updatedUserData) => {
    dispatch({ type: "UPDATE_USER", payload: updatedUserData });
  };

  const logout = () => {
    localStorage.removeItem("apiShield_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register, updateUser }}>
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
