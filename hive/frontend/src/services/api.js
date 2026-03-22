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

//User Service APIs end


//Resource Service APIs begin

//--------------Resources------------------




//Resource Service APIs end

//Chat Service APIs begin

//--------------Chat------------------





//Chat Service APIs end

//Note Service APIs begin

//--------------Notes------------------




//Note Service APIs end

//Progress Service APIs begin

//--------------Progress------------------




//Progress Service APIs end

//Session Service APIs begin

//--------------Sessions------------------

export const getAllSessions = async () => {
  const response = await instance.sessionService.get(`/api/studysession`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
};

export const getCurrentMonthSessions = async () => {
  const response = await instance.sessionService.get(`/api/studysession/current-month`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
}

export const getNextMonthSessions = async () => {
  const response = await instance.sessionService.get(`/api/studysession/next-month`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
}

export const getSessionsByMonth = async (month) => {
  const response = await instance.sessionService.get(`/api/studysession/month/${month}`, {
    headers: instance.defaultHeaders()
  });
  return response.data;
}

export const getSessionById = async (id) => {
  const response = await instance.sessionService.get(`/api/studysession/${id}`, {
    headers: instance.defaultHeaders() 
  });
  return response.data;
};

//--------------Admin-only Session APIs------------------//

export const createSession = async ({ title, description, date, time, duration }) => {
  const response = await instance.sessionService.post(
    `/api/studysession/create`,
    {
      title,
      description,
      date,
      time,
      duration,
    },
    {
      headers: instance.defaultHeaders()
    },
  );
  return response.data;
};

export const updateSession = async (id, { title, description, date, time, duration }) => {
  const response = await instance.sessionService.put(
    `/api/studysession/update/${id}`,
    { title, description, date, time, duration },
    {
      headers: instance.defaultHeaders() 
    },
  );
  return response.data;
};

export const deleteSession = async (id) => {
  const response = await instance.sessionService.delete(
    `/api/studysession/delete/${id}`,
    {
      headers: instance.defaultHeaders() 
    },
  );
  return response.data;
};




//Session Service APIs end


