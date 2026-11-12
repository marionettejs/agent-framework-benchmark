export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  return proxyRequest(
    event,
    (process.env.API_BASE_URL || "http://localhost:9000") +
      "/media/sprites/pokemon/" +
      q.id +
      ".png",
  );
});
