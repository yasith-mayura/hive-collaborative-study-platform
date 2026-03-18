import axios from "axios";
import token from "./utilities"

const defaultHeaders = (contentType = "application/json") => {
  return {
    "Content-Type": contentType,
    "Accept-Language": "es-US",
    Accept: "application/json",
    Authorization: "Bearer " + token.getAuthToken(),
  };
};

const authService = axios.create({
    baseURL: import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:3000",
    timeout: 30000,
});

const userService = axios.create({
    baseURL: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:3001",
    timeout: 30000,
});

const resourceService = axios.create({
    baseURL: import.meta.env.VITE_RESOURCE_SERVICE_URL || "http://localhost:3002",
    timeout: 30000,
});

const chatService = axios.create({
    baseURL: import.meta.env.VITE_CHAT_SERVICE_URL || "http://localhost:3003",
    timeout: 30000,
});

const noteService = axios.create({
    baseURL: import.meta.env.VITE_NOTE_SERVICE_URL || "http://localhost:3004",
    timeout: 30000,
});

const progressService = axios.create({
    baseURL: import.meta.env.VITE_PROGRESS_SERVICE_URL || "http://localhost:3005",
    timeout: 30000,
});

const sessionService = axios.create({
    baseURL: import.meta.env.VITE_SESSION_SERVICE_URL || "http://localhost:3006",
    timeout: 30000,
});

const ragService = axios.create({
    baseURL: import.meta.env.VITE_RAG_SERVICE_URL || "http://localhost:8000",
    timeout: 30000,
});



const instance = {
    defaultHeaders,
    authService,
    userService,
    resourceService,
    chatService,
    noteService,
    progressService,
    sessionService,
    ragService,
};

export default instance;
