export const logResult = (res) => {
  console.log(
    "___________________________________________________REQUEST RESULT"
  );
  console.log(res.error ? 400 : 200);
};
