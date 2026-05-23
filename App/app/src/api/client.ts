// src/api/client.ts

import axios from "axios";

import { getBaseURL, getToken } from "../state/auth";
import { getDeviceId } from "../state/device";

// =========================================
// BASE URL
// =========================================

const baseURL = getBaseURL() || "http://localhost:8080";

// =========================================
// API
// =========================================

export const api = axios.create({
  baseURL,
  timeout: 10000,

  headers: {
    "Content-Type":
      "application/json",
  },
});

// =========================================
// REQUEST INTERCEPTOR
// =========================================

api.interceptors.request.use(
  (config) => {
    const token =
      getToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    config.headers[
      "x-device-id"
    ] = getDeviceId();

    return config;
  },
);

// =========================================
// RESPONSE INTERCEPTOR
// =========================================

api.interceptors.response.use(
  (response) => response,
  (error) => {

    console.error(
      "❌ API Error:",
      {
        url:
          error.config?.url,
        status:
          error.response?.status,
        data:
          error.response?.data,
      },
    );

    return Promise.reject(
      error,
    );
  },
);