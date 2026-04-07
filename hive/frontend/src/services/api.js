// import axios from "axios";
import instance from "../lib/axios";

export const verifyToken = async () => {
  const response = await instance.authService.post(
    `/auth/verify`,
    {},
    {
      headers: instance.defaultHeaders()
    },
  );

  return response.data;
};

export const logoutSession = async () => {
  const response = await instance.authService.post(
    `/auth/logout`,
    {},
    {
      headers: instance.defaultHeaders()
    },
  );

  return response.data;
};

//Auth Service APIs end

//User Service APIs begin


//--------------Users------------------
export const registerUser = async ({
  name,
  email,
  password,
  studentNumber,
}) => {
  const response = await instance.userService.post(`/api/users/register`, {
    name,
    email,
    password,
    studentNumber,
  });

  return response.data;
};

export const getAllUsers = async () => {
  const response = await instance.userService.get(`/api/users`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const getAllStudents = async () => {
  const response = await instance.userService.get(`/api/students`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const getUserByStudentNumber = async (studentNumber) => {
  const response = await instance.userService.get(
    `/api/users/${encodeURIComponent(studentNumber)}`,
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const getMyProfile = async () => {
  const response = await instance.userService.get(`/api/users/me`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const updateMyProfile = async ({ name, password }) => {
  const response = await instance.userService.put(
    `/api/users/me`,
    {
      name,
      password,
    },
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const createUser = async ({ name, email, password, studentNumber }) => {
  const response = await instance.userService.post(
    `/api/users`,
    {
      name,
      email,
      password,
      studentNumber,
    },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const deleteUser = async (studentNumber) => {
  const response = await instance.userService.delete(
    `/api/users/${encodeURIComponent(studentNumber)}`,
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const updateUser = async (
  studentNumber,
  { name, email, studentNumber: nextStudentNumber }
) => {
  const response = await instance.userService.put(
    `/api/users/${encodeURIComponent(studentNumber)}`,
    {
      name,
      email,
      studentNumber: nextStudentNumber,
    },
    {
      headers: instance.defaultHeaders(),
    },
  );
  return response.data;
};


//--------------Admins------------------

export const getAllAdmins = async () => {
  const response = await instance.userService.get(`/api/admins`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
}

export const createAdmin = async ({ name, email, password, studentNumber }) => {
  const response = await instance.userService.post(
    `/api/admins`,
    {
      name,
      email,
      password,
      studentNumber,
    },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const promoteUserToAdmin = async (studentNumber) => {
  const response = await instance.userService.post(
    `/api/admins/promote/${encodeURIComponent(studentNumber)}`,
    {},
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const demoteAdminToUser = async (studentNumber) => {
  const response = await instance.userService.post(
    `/api/admins/demote/${encodeURIComponent(studentNumber)}`,
    {},
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const deleteAdmin = async (studentNumber) => {
  const response = await instance.userService.delete(
    `/api/admins/${encodeURIComponent(studentNumber)}`,
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const updateAdmin = async (
  studentNumber,
  { name, email, studentNumber: nextStudentNumber }
) => {
  const response = await instance.userService.put(
    `/api/admins/${encodeURIComponent(studentNumber)}`,
    {
      name,
      email,
      studentNumber: nextStudentNumber,
    },
    {
      headers: instance.defaultHeaders(),
    },
  );
  return response.data;
};

export const getBatchLevels = async () => {
  const response = await instance.userService.get(`/api/batch-levels`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getBatchLevelBatches = async () => {
  const response = await instance.userService.get(`/api/batch-levels/batches`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const getMyAssignedLevel = async () => {
  const response = await instance.userService.get(`/api/batch-levels/me`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

export const assignBatchLevel = async ({ batch, level, confirmReplace = false }) => {
  const response = await instance.userService.post(
    `/api/batch-levels`,
    { batch, level, confirmReplace },
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};

export const removeBatchLevel = async (batch) => {
  const response = await instance.userService.delete(`/api/batch-levels/${encodeURIComponent(batch)}`, {
    headers: instance.defaultHeaders(),
  });
  return response.data;
};

//User Service APIs end


//Resource Service APIs begin

//--------------Resources------------------




export const getAllCourses = async () => {
  const response = await instance.resourceService.get(`/resources/subjects`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const getAllSubjects = getAllCourses;

export const getCourseResources = async (subjectId) => {
  const response = await instance.resourceService.get(`/resources/subjects/${encodeURIComponent(subjectId)}`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const uploadResource = async (formData) => {
  // formData because we use multipart/form-data for file uploads
  const headers = instance.defaultHeaders();
  delete headers["Content-Type"]; // Axios will set multipart/form-data with boundary

  const response = await instance.resourceService.post(`/resources/upload`, formData, {
    headers: headers
  });
  return response.data;
};

//Resource Service APIs end

//Chat Service APIs begin

//--------------Chat------------------

export const getBatchChatHistory = async (batch) => {
  const response = await instance.chatService.get(
    `/api/chat/history/${encodeURIComponent(batch)}`,
    {
      headers: instance.defaultHeaders(),
    }
  );
  return response.data;
};



//Chat Service APIs end

//Note Service APIs begin

//--------------Notes------------------
export const getNotes = async () => {
  const response = await instance.noteService.get(`/api/notes`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const createNote = async ({ content, isVoiceNote, title }) => {
  const response = await instance.noteService.post(
    `/api/notes/create`,
    { content, isVoiceNote, title },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await instance.noteService.delete(
    `/api/notes/delete/${encodeURIComponent(id)}`,
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const updateNote = async (id, { content, title }) => {
  const response = await instance.noteService.put(
    `/api/notes/update/${encodeURIComponent(id)}`,
    { content, title },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};
//Note APIs end

//--------------Flashcards------------------

export const getFlashCardDecks = async () => {
  const response = await instance.noteService.get(`/api/notes/flashcards`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const createFlashCardDeck = async ({ name, cards }) => {
  const response = await instance.noteService.post(
    `/api/notes/flashcards`,
    { name, cards },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};  

export const updateFlashCardDeck = async (id, { name, cards }) => {
  const response = await instance.noteService.put(
    `/api/notes/flashcards/${encodeURIComponent(id)}`,
    { name, cards },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const deleteFlashCardDeck = async (id) => {
  const response = await instance.noteService.delete(
    `/api/notes/flashcards/${encodeURIComponent(id)}`,
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};
//Flashcard APIs end

//Note Service APIs end



//Progress Service APIs begin

//--------------Progress-----------------------




//Progress Service APIs end

//Session Service APIs begin

//--------------Sessions------------------

const isNotFoundError = (error) => {
  return error?.response?.status === 404;
};

const sessionGetWithFallback = async (primaryPath, legacyPath) => {
  try {
    const response = await instance.sessionService.get(primaryPath, {
      headers: instance.defaultHeaders()
    });
    return response.data;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const fallbackResponse = await instance.sessionService.get(legacyPath, {
      headers: instance.defaultHeaders()
    });
    return fallbackResponse.data;
  }
};

const sessionPostWithFallback = async (primaryPath, legacyPath, payload) => {
  try {
    const response = await instance.sessionService.post(primaryPath, payload, {
      headers: instance.defaultHeaders()
    });
    return response.data;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const fallbackResponse = await instance.sessionService.post(legacyPath, payload, {
      headers: instance.defaultHeaders()
    });
    return fallbackResponse.data;
  }
};

const sessionPutWithFallback = async (primaryPath, legacyPath, payload) => {
  try {
    const response = await instance.sessionService.put(primaryPath, payload, {
      headers: instance.defaultHeaders()
    });
    return response.data;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const fallbackResponse = await instance.sessionService.put(legacyPath, payload, {
      headers: instance.defaultHeaders()
    });
    return fallbackResponse.data;
  }
};

const sessionDeleteWithFallback = async (primaryPath, legacyPath) => {
  try {
    const response = await instance.sessionService.delete(primaryPath, {
      headers: instance.defaultHeaders()
    });
    return response.data;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const fallbackResponse = await instance.sessionService.delete(legacyPath, {
      headers: instance.defaultHeaders()
    });
    return fallbackResponse.data;
  }
};

export const getAllSessions = async () => {
  return sessionGetWithFallback(`/api/sessions`, `/api/studysession`);
};

export const getCurrentMonthSessions = async () => {
  return sessionGetWithFallback(`/api/sessions/current-month`, `/api/studysession/current-month`);
}

export const getNextMonthSessions = async () => {
  return sessionGetWithFallback(`/api/sessions/next-month`, `/api/studysession/next-month`);
}

export const getSessionsByMonth = async (month, year) => {
  const query = year ? `?year=${encodeURIComponent(year)}` : "";
  return sessionGetWithFallback(
    `/api/sessions/month/${month}${query}`,
    `/api/studysession/month/${month}`
  );
}

export const getSessionById = async (id) => {
  return sessionGetWithFallback(`/api/sessions/${id}`, `/api/studysession/${id}`);
};

//--------------Admin-only Session APIs------------------//

export const createSession = async ({ subjectCode, type, topic, description, date, time, batch }) => {
  return sessionPostWithFallback(
    `/api/sessions`,
    `/api/studysession/create`,
    {
      subjectCode,
      type,
      topic,
      description,
      date,
      time,
      batch,
    }
  );
};

export const updateSession = async (id, { subjectCode, type, topic, description, date, time }) => {
  return sessionPutWithFallback(
    `/api/sessions/${id}`,
    `/api/studysession/update/${id}`,
    { subjectCode, type, topic, description, date, time },
  );
};

export const deleteSession = async (id) => {
  return sessionDeleteWithFallback(`/api/sessions/${id}`, `/api/studysession/delete/${id}`);
};

//Session Service APIs end





