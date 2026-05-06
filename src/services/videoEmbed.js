export const getVideoEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube (youtube.com/watch?v=...)
  const youtubeWatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (youtubeWatch) return `https://www.youtube.com/embed/${youtubeWatch[1]}`;

  // YouTube Shorts
  const youtubeShorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (youtubeShorts) return `https://www.youtube.com/embed/${youtubeShorts[1]}`;

  // youtu.be
  const youtuBe = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBe) return `https://www.youtube.com/embed/${youtuBe[1]}`;

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Loom
  const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9_-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;

  // Si no coincide, devuelve la URL original
  return url;
};