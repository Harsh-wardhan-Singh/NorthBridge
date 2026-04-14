import {
  getCurrentUser,
  listUsers,
  login,
  logout,
  signup,
  type PublicUser,
} from '../services/user.service';

export type AuthRequestBody = {
  email?: string;
  password?: string;
  name?: string;
  location?: string;
  userId?: string;
};

export type ControllerResult<T> = {
  status: number;
  body: T;
};

export function getCurrentUserController(body: AuthRequestBody): ControllerResult<{
  user: PublicUser | null;
}> {
  const result = getCurrentUser(body);
  return {
    status: result.status,
    body: { user: result.data },
  };
}

export function loginController(body: AuthRequestBody): ControllerResult<{
  user: PublicUser | null;
  token?: string;
  message?: string;
}> {
  const result = login(body);

  return {
    status: result.status,
    body: {
      user: result.data?.user ?? null,
      token: result.data?.token,
      message: result.message,
    },
  };
}

export function signupController(body: AuthRequestBody): ControllerResult<{
  user: PublicUser | null;
  token?: string;
  message?: string;
}> {
  const result = signup(body);
  return {
    status: result.status,
    body: {
      user: result.data?.user ?? null,
      token: result.data?.token,
      message: result.message,
    },
  };
}

export function logoutController(): ControllerResult<Record<string, never>> {
  const result = logout();
  return {
    status: result.status,
    body: {},
  };
}

export function listUsersController(): ControllerResult<{ users: PublicUser[] }> {
  const result = listUsers();
  return {
    status: result.status,
    body: {
      users: result.data ?? [],
    },
  };
}
