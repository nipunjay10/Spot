// turns a stored date into something friendly like "July 2026"
export function memberSince(createdAt) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
