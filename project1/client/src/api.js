// src/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001", // MES api backend (aligned with server)
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
