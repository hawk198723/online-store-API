const path = require("path");
const fs = require("fs");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();
server.use(jsonServer.bodyParser);
server.use(middlewares);

const getUsersDb = () => {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "users.json"), "UTF-8")
  );
};
const isAuthenticated = ({ email, password }) => {
  return (
    getUsersDb().users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
};

const SECRET = "123456789zxcvbnm";

const expiresIn = "1h";

const createToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

server.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (isAuthenticated({ email, password })) {
    const user = getUsersDb().users.find(
      (u) => u.email === email && u.password === password
    );
    const { nickname, type } = user;
    //jwt
    const jwToken = createToken({ nickname, type, email });
    res.status(200).json(jwToken);
    return;
  } else {
    const status = 401;
    const message = "incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }
});

server.post("/auth/register", (req, res) => {
  const { email, password, nickname, type } = req.body;
  //1
  if (isAuthenticated({ email, password })) {
    const status = 401;
    const message = "Email and Password already exist";
    res.status(status).json({ status, message });
    return;
  }

  //2
  fs.readFile(path.join(__dirname, "user.json"), (err, _data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
    //get current user data
    const data = JSON.parse(_data.toString());
    //get the id of last user
    const last_item_id = data.users[data.users.length - 1].id;
    //add new user
    data.users.push({ id: last_item_id + 1, email, password, nickname, type }); //add some data
    fs.writeFile(
      path.join(__dirname, "users.json"),
      JSON.stringify(data),
      (err) => {
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
          return;
        }
      }
    );
  });
  //create token for new user
  const jwToken = createToken({ nickname, type, email });
  res.status(200).json(jwToken);
  return;
});

server.use(router);
server.listen(3003, () => {
  console.log("JSON Server is running");
});
