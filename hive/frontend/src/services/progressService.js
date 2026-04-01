import instance from "../lib/axios";

export const getProgress = async () => {
  const response = await instance.progressService.get("/api/progress", {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getProgressByUserId = async (userId) => {
  const response = await instance.progressService.get(
    `/api/progress/${encodeURIComponent(userId)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const addSemester = async (payload) => {
  const response = await instance.progressService.post("/api/progress/semester", payload, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const updateSemester = async (semesterId, payload) => {
  const response = await instance.progressService.put(
    `/api/progress/semester/${encodeURIComponent(semesterId)}`,
    payload,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const deleteSemester = async (semesterId) => {
  const response = await instance.progressService.delete(
    `/api/progress/semester/${encodeURIComponent(semesterId)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const getProgressSummary = async (userId) => {
  const suffix = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const response = await instance.progressService.get(`/api/progress/summary${suffix}`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};
