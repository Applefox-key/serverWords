import request from "supertest";
import app from "../app.js";

import { login } from "../modules/usersM.js";
// .set({ "Authorization": `Bearer 16694170186811` })

describe("GET /users", () => {
  describe("when passed no token", () => {
    test("should respond with a 403 status code", async () => {
      const response = await request(app).get("/users");
      expect(response.statusCode).toBe(403);
    });
  });
  describe("when passed a token", () => {
    test("and its exist should respond with a 200 status code", async () => {
      const response = await request(app)
        .get("/users")
        .set({ "Authorization": `Bearer 1` });

      expect(response.statusCode).toBe(200);
    });
    test("and its not exist should respond with a 403 status code", async () => {
      const response = await request(app)
        .get("/users")
        .set({ "Authorization": `Bearer 2` });

      expect(response.statusCode).toBe(403);
    });
    test("should respond with a 200 status code, with a json object that contains the id from the database ", async () => {
      const response = await request(app)
        .get("/users")
        .set({ "Authorization": `Bearer 1` });
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty("id");
    });
  });
});

describe("POST /users", () => {
  describe("when data is missing", () => {
    test("should respond with a 400 status code", async () => {
      const response = await request(app).post("/users");
      expect(response.statusCode).toBe(400);
    });
  });
  describe("when the email or password is missing", () => {
    test("should respond with a 400 status code with a json object that contains the error", async () => {
      const response = await request(app).post("/users").set({
        password: "1",
        name: "test",
        img: "",
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
    test("should respond with a 400 status code with a json object that contains the error", async () => {
      const response = await request(app).post("/users").set({
        email: "test@test.test",
        password: "",
        name: "test",
        img: "",
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("when data's ok", () => {
    test("should respond with a 200 status code with", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          data: {
            email: "testNew@test.test",
            password: "testNew",
            name: "test New",
            img: "",
          },
        });

      expect(response.statusCode).toBe(200);
    });
  });
  describe("when user is alredy exist", () => {
    test("should respond with a 400 status code with a json object that contains the error:user already exists", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          data: {
            email: "test@test.test",
            password: "1",
            name: "test@test.test",
            img: "",
          },
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toEqual("user already exists");
    });
  });
});

describe("POST /users/login", () => {
  describe("when data's ok", () => {
    test("should respond with a 200 status code with a json object that contains the message", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          data: {
            email: "testNew@test.test",
            password: "testNew",
          },
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("role");
    });
  });
});

describe("PATCH /users", () => {
  describe("when data's ok", () => {
    test("should respond with a 200 status code with a json object that contains the message", async () => {
      const response = await request(app)
        .patch("/users")
        .set({ "Authorization": `Bearer testtoken` })
        .send({
          data: { name: "testWewname" },
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });
});

describe("DELETE /users/logout", () => {
  describe("when token's ok", () => {
    test("should respond with a 200 status code with a json object that contains the message", async () => {
      const response = await request(app)
        .delete("/users/logout")
        .set({ "Authorization": `Bearer testtoken` });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });
});

describe("DELETE /users", () => {
  describe("when token's ok", () => {
    test("should respond with a 200 status code with a json object that contains the message", async () => {
      const r = await login("testNew@test.test", "testNew");
      const response = await request(app)
        .delete("/users")
        .set({ "Authorization": `Bearer testtoken` });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });
});

// describe("PATCH /users", () => {
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
