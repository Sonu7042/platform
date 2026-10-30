import { axiosClient } from './axiosClient';

export async function fetchWebsites(params) {
  const { data } = await axiosClient.get('/websites', { params });
  return data;
}

export async function fetchWebsiteStats() {
  const { data } = await axiosClient.get('/websites/stats');
  return data.data;
}

export async function fetchWebsite(id) {
  const { data } = await axiosClient.get(`/websites/${id}`);
  return data.data;
}

export async function createWebsiteRequest(payload) {
  const { data } = await axiosClient.post('/websites', payload);
  return data.data;
}

export async function updateWebsiteRequest(id, payload) {
  const { data } = await axiosClient.patch(`/websites/${id}`, payload);
  return data.data;
}

export async function deleteWebsiteRequest(id) {
  await axiosClient.delete(`/websites/${id}`);
}
