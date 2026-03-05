import api from "./api";
// import publicAPI from "./public.api";

const { registerUser, verifyToken, logoutSession } = api;

const API = {
  api: api,
};

export { registerUser, verifyToken, logoutSession };
export default API;