import { axiosClient } from './axiosClient';

export async function registerRequest(payload) {
  const { data } = await axiosClient.post('/auth/register', payload);
  return data.data;
}

export async function loginRequest(payload) {
  const { data } = await axiosClient.post('/auth/login', payload);
  return data.data;
}

export async function meRequest() {
  const { data } = await axiosClient.get('/auth/me');
  return data.data;
}
