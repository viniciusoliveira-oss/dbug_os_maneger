
export const createPageUrl = (page: string) => {
  return `/#/${page.toLowerCase()}`;
};

export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
