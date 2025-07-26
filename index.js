import app from "./app.js";
const port = 8000;
app.listen(port, () => {
  // app.listen(port, "192.168.0.5", () => {
  console.log("Server running on port %PORT%".replace("%PORT%", port));
});
