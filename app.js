const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = "";

const installDatabase = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Db Error : ${error.message}`);
    process.exit(1);
  }
};

installDatabase();
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = " ", priority, status } = request.query;

  switch (true) {
    case hasStatusAndPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND
            todo.priority = "${priority}" AND todo.status = "${status}";`;
      break;
    case hasStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo.status = "${status}";`;
      break;
    case hasPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
            todo.priority = "${priority}";`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" ;`;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE todo.id = "${todoId}";`;
  const todoDetails = await db.get(getTodoQuery);
  response.send(todoDetails);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `INSERT INTO todo (id,todo,priority,status)
                VALUES ('${id}','${todo}','${priority}','${status}');`;

  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  let updatedColumn = "";
  switch (true) {
    case todoDetails.status !== undefined:
      updatedColumn = "Status";
      break;
    case todoDetails.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case todoDetails.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const getTodoQuery = `SELECT * FROM todo WHERE id = "${todoId}";`;
  const previousTodo = await db.get(getTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodo = `UPDATE todo
    SET 
    todo ='${todo}',priority='${priority}',status='${status}'
    WHERE todo.id = '${todoId}';`;

  await db.run(updateTodo);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo where todo.id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
