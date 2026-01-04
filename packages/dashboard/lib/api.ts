import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enable cookies for CSRF
});

// CSRF Token Management
let csrfToken: string | null = null;

export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
    if (!csrfToken) {
      throw new Error("CSRF token not returned from server");
    }
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    throw error;
  }
};

// Request interceptor: Add JWT token and CSRF token
api.interceptors.request.use(async (config) => {
  // Add JWT token for authentication
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests
  if (config.method && ["post", "put", "patch", "delete"].includes(config.method.toLowerCase())) {
    // Fetch CSRF token if we don't have one
    if (!csrfToken) {
      try {
        await fetchCsrfToken();
      } catch (error) {
        console.warn("Could not fetch CSRF token, request may fail");
      }
    }

    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

// Response interceptor: Handle CSRF token errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If CSRF token is invalid, refresh it and retry
    if (error.response?.status === 403 && error.response?.data?.code === "EBADCSRFTOKEN") {
      console.log("CSRF token invalid, refreshing...");
      csrfToken = null;
      await fetchCsrfToken();

      // Retry the original request
      const originalRequest = error.config;
      if (csrfToken) {
        originalRequest.headers["X-CSRF-Token"] = csrfToken;
      }
      return api.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
    if (token) {
        localStorage.setItem("token", token);
    } else {
        localStorage.removeItem("token");
    }
};

export const authAPI = {
  login: (email: string, name?: string) =>
    api.post("/auth/login", { email, name }),
};

export const projectsAPI = {
  list: () => api.get("/projects"),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  updateBuildConfig: (id: string, data: any) => api.put(`/projects/${id}/build-config`, data),
};

export const deploymentsAPI = {
  list: () => api.get("/deployments"),
  create: (data: any) => api.post("/deployments", data),
  get: (id: string) => api.get(`/deployments/${id}`),
  listByProject: (projectId: string) =>
    api.get(`/deployments/project/${projectId}`),
  cancel: (id: string) => api.post(`/deployments/${id}/cancel`),
};

export const domainsAPI = {
  list: (projectId: string) => api.get(`/projects/${projectId}/domains`),
  add: (projectId: string, domain: string) => api.post(`/projects/${projectId}/domains`, { domain }),
  remove: (projectId: string, domain: string) => api.delete(`/projects/${projectId}/domains/${domain}`),
  verify: (projectId: string, domain: string) => api.post(`/projects/${projectId}/domains/${domain}/verify`),
};

export default api;
