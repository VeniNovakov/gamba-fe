// api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config:any) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
