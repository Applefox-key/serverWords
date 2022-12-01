import app from "./app.js";
const port = 9002;
app.listen(port, () => {
  console.log("Server running on port %PORT%".replace("%PORT%", port));
});
