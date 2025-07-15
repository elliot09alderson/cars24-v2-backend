import shortid from "shortid";
export const slugify = (name, model) => {
  let slug = `${name} ${model}`.toLowerCase();

  slug = slug
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  // Add short unique id
  const uniqueId = shortid.generate();

  return `${slug}-${uniqueId}`;
};
