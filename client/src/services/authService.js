const API_URL = "http://localhost:5555/api";

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }
  return response.json();
};

export const registerUser = async (username, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Registration failed");
  }
  return response.json();
};

export const getUserFavorites = async (username) => {
  const response = await fetch(`${API_URL}/user/${username}/favorites`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get favorites");
  }
  return response.json();
};

export const updateFavorites = async (username, movie, action) => {
  const response = await fetch(`${API_URL}/favorites/${username}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movie, action })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Favorite update failed");
  }
  return response.json();
};