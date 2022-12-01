export const emaileValidation = (email) => {
  if (!email) {
    return { error: "No email specified" };
  }
  return { message: "OK" };
};
