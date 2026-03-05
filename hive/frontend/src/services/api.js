import axios from "axios";

const trimTrailingSlash = (value) => value.replace(/\/$/, "");

const AUTH_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:3000"
);

const USER_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:3001"
);

const API_GATEWAY_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:4000/api/v1"
);

const REGISTER_CANDIDATE_ENDPOINTS = [
  import.meta.env.VITE_REGISTER_ENDPOINT,
  `${USER_BASE_URL}/api/users/register`,
  `${USER_BASE_URL}/api/users`,
  `${USER_BASE_URL}/users`,
  `${API_GATEWAY_BASE_URL}/users/register`,
  `${API_GATEWAY_BASE_URL}/users`,
].filter(Boolean);

export const registerUser = async ({ name, email, password, studentNumber }) => {
  let latestError = null;

  for (const url of REGISTER_CANDIDATE_ENDPOINTS) {
    try {
      const response = await axios.post(url, {
        name,
        email,
        password,
        studentNumber,
      });

      return response.data;
    } catch (error) {
      const statusCode = error?.response?.status;

      // Try the next candidate if this endpoint does not exist.
      if (statusCode === 404) {
        continue;
      }

      latestError = error;
      break;
    }
  }

  if (latestError) {
    throw latestError;
  }

  throw new Error("No signup endpoint is reachable. Set VITE_REGISTER_ENDPOINT in frontend/.env");
};

export const verifyToken = async (idToken) => {
  const response = await axios.post(
    `${AUTH_BASE_URL}/auth/verify`,
    {},
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response.data;
};

export const logoutSession = async (idToken) => {
  const response = await axios.post(
    `${AUTH_BASE_URL}/auth/logout`,
    {},
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response.data;
};

const api = {
  registerUser,
  verifyToken,
  logoutSession,
};

export default api;