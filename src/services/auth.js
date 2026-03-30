import {api} from './api'

export const login = async () => {
  const res = await api.post("/login", {
    email: "react@hipster-inc.com",
    password: "React@123",
    key_pass: "07ba959153fe7eec778361bf42079439",
  });

  const token = res.data?.data?.data?.token?.token;


  if (token) {
    localStorage.setItem("token", token);
  } else {
    console.error("❌ TOKEN NOT FOUND");
  }

  return token;
};