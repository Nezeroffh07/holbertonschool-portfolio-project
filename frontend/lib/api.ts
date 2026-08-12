export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");

  if (token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  return {
    "Content-Type": "application/json",
  };
}