import axios from "axios";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_STREAM_TOKEN) {
  throw new Error("Missing Cloudflare Stream env variables");
}

const streamAxios = axios.create({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
  headers: {
    Authorization: `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
  },
});

// 🟢 Upload video
export const uploadVideo = async (file: File | Blob, fileName = "video") => {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const response = await streamAxios.post("/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// 🟡 Get all videos
export const getVideos = async () => {
  const response = await streamAxios.get("/");
  const videos = response.data?.result;
  const videosWithPlaybackUrls = videos.map((video: any) => ({
    uid: video.uid,
    thumbnail: video.thumbnail,
    playbackUrl: `https://videodelivery.net/${video.uid}/manifest/video.m3u8`,
  }));
  return videosWithPlaybackUrls;
};

// 🔴 Delete a video by ID
export const deleteVideo = async (videoId: string) => {
  const response = await streamAxios.delete(`/${videoId}`);
  return response.data;
};
