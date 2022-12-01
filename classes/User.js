export class User {
  token;
  user;

  static getInstance() {
    if (!User._instance) {
      User._instance = new User();
    }
    return User._instance;
  }

  setToken(token) {
    this.token = token;
  }
  setUser(user) {
    this.user = user;
  }
}
