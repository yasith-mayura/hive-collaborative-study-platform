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

export const getCourses = async (params = {}) => {
  const search = new URLSearchParams();
  if (params.level) search.set("level", String(params.level));
  if (params.year) search.set("level", String(params.year));
  if (params.semester) search.set("semester", String(params.semester));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const response = await instance.progressService.get(`/api/progress/courses${suffix}`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getCourseByCode = async (courseCode) => {
  const response = await instance.progressService.get(
    `/api/progress/courses/${encodeURIComponent(courseCode)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const createCourse = async (payload) => {
  const response = await instance.progressService.post("/api/progress/courses", payload, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const updateCourse = async (courseCode, payload) => {
  const response = await instance.progressService.put(
    `/api/progress/courses/${encodeURIComponent(courseCode)}`,
    payload,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const deleteCourse = async (courseCode) => {
  const response = await instance.progressService.delete(
    `/api/progress/courses/${encodeURIComponent(courseCode)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};
