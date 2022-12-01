import request from "supertest";
import app from "../app.js";
// .set({ "Authorization": `Bearer 16694170186811` })

// describe("POST /pbcollections", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
describe("GET /pbcollections", () => {
  describe("when passed no token", () => {
    test("should respond with a 403 status code", async () => {
      const response = await request(app).get("/pbcollections");
      expect(response.statusCode).toBe(403);
    });
  });
});
// describe("GET /pbcollections/user", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("DELETE /pbcollections/user", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("GET /pbcollections/content", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("DELETE /pbcollections/:id", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });

// should save the username and password in the database
// should respond with a json object that contains the id from the database. (probably jwt in the real world)
// should respond with a 200 status code
// should specify json as the content type in the http header.
// should save the username and password in the database
// should respond with a json object that contains the id from the database. (probably jwt in the real world)
// should respond with a 200 status code
// should specify json as the content type in the http header.
// should return a 400 status code to show there was a user error.
// should return a json object that contains an error message.
// should specify json as the content type in the http header.  });
