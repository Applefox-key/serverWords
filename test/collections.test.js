import request from "supertest";
import app from "../app.js";
// .set({ "Authorization": `Bearer 16694170186811` })

// describe("POST /collections", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("POST /collections/content", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
describe("GET /collections", () => {
  describe("when passed no token", () => {
    test("should respond with a 403 status code", async () => {
      const response = await request(app).get("/collections");
      // .set({ "Authorization": `Bearer 1` });
      expect(response.statusCode).toBe(403);
    });
  });
});
// describe("DELETE /collections", () => {
//   describe("when passed invalid id", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).delete("/collections");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("GET /collections/:id", () => {
//   describe("when passed invalid id", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("PATCH /collections/:id", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
describe("DELETE /collections/:id", () => {
  describe("when passed invalid id", () => {
    test("should respond with a 403 status code", async () => {
      const response = await request(app)
        .delete("/collections/new")
        .set({ "Authorization": `Bearer 1` });
      //  expect(response).toHaveProperty("success");
      expect(response.statusCode).toBe(400);
    });
  });
});
// describe("GET /collections/:id/content", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("GET /collections/:id/content", () => {
//   describe("when passed no token", () => {
//     test("should respond with a 403 status code", async () => {
//       const response = await request(app).get("/users");
//       expect(response.statusCode).toBe(403);
//     });
//   });
// });
// describe("DELETE /collections/:id/content", () => {
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
