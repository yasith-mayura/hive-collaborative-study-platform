const getAuthToken = () => {
  return localStorage.getItem("token");
};

const setAuthToken = (authToken) => {
  localStorage.setItem("token", authToken);
};

const getUserData = () => {
  let userData = localStorage.getItem("user");
  if (userData != null) {
    return JSON.parse(userData);
  }
  return null;
};

const setUserData = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
};

const token = {
  getAuthToken,
  setAuthToken,

  getUserData,
  setUserData,
};

export default token;
