import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (refreshToken) {
        try {
          const res = await axios.post("http://localhost:8080/api/auth/refresh", {
            refresh_token: refreshToken,
          });

          if (res.status === 200) {
            const { access_token, refresh_token } = res.data.tokens;

            localStorage.setItem("access", access_token);
            localStorage.setItem("refresh", refresh_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
          localStorage.clear();
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);