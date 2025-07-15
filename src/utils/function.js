export const generateSlug = (title) => {
  let slug = title
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, "-");

  const uniqueNumber = Date.now();
  return `${slug}-${uniqueNumber}`;
};
