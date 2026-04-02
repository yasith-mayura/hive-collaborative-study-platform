import instance from "../lib/axios";

export const getAllCourses = async () => {
  const response = await instance.resourceService.get("/resources/subjects", {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getCourseByCode = async (subjectCode) => {
  const response = await instance.resourceService.get(
    `/resources/subjects/${encodeURIComponent(subjectCode)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const uploadResource = async (formData, onUploadProgress) => {
  const headers = instance.defaultHeaders();
  delete headers["Content-Type"];

  const response = await instance.resourceService.post("/resources/upload", formData, {
    headers,
    onUploadProgress,
  });
  return response.data;
};

export const getResourcesBySubject = async (subjectCode) => {
  const response = await instance.resourceService.get(
    `/resources/subject/${encodeURIComponent(subjectCode)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const getResourceById = async (resourceId) => {
  const response = await instance.resourceService.get(
    `/resources/${encodeURIComponent(resourceId)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const getDownloadUrl = async (resourceId) => {
  const response = await instance.resourceService.get(
    `/resources/${encodeURIComponent(resourceId)}/download`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const deleteResource = async (resourceId) => {
  const response = await instance.resourceService.delete(
    `/resources/${encodeURIComponent(resourceId)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const getResourceStats = async () => {
  const response = await instance.resourceService.get("/resources/stats", {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};
