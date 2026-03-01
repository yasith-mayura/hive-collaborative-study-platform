import { createContext, useState, useContext, useEffect, React } from "react";
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState({
    // token: localStorage.getItem("token") || null,
    name: localStorage.getItem("name") || "Jhon doe", //null
    role: localStorage.getItem("role") || "ADMIN",//null
    // tenantCode: localStorage.getItem("tenantCode") || null,
  });

  const login = (token, name, role, tenantCode) => {
    // localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    // localStorage.setItem("tenantCode", tenantCode);
    setAuthData({ name, role,  }) //tenantCode,token
  };

  const logout = () => {
    // localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    // localStorage.removeItem("tenantCode");
    setAuthData({  name: null, role: null,  }) //token: null,tenantCode:null
  };

  return (
    <AuthContext.Provider value={{ authData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
