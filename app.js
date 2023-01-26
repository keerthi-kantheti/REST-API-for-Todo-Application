const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server and Database connected successfully!!!");
    });
  } catch (e) {
    console.log(`db error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//API 1

app.get("/todos/", async (request, response) => {
  let resultArray = null;
  let getReqTodosQuery = null;
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    //scenario 3
    case hasPriorityAndStatus(request.query):
      getReqTodosQuery = `SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND priority='${priority}'
            AND status='${status}';`;
      break;

    //scenario 3
    case hasPriorityProperty(request.query):
      getReqTodosQuery = `SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND priority='${priority}';`;
      break;
    //scenario 1
    case hasStatusProperty(request.query):
      getReqTodosQuery = `SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND status='${status}';`;
      break;

    //default case
    default:
      getReqTodosQuery = `SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%';`;
  }
  resultArray = await db.all(getReqTodosQuery);
  response.send(resultArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const reqTodo = await db.get(getTodoQuery);
  response.send(reqTodo);
});

//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;

  const { id, todo, priority, status } = todoDetails;

  const insertTodoQuery = `INSERT INTO todo(id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId", async (request, response) => {
  let message = null;

  const { todoId } = request.params;
  const todoDetails = request.body;
  switch (true) {
    case todoDetails.status !== undefined:
      message = "Status";
      break;
    case todoDetails.priority !== undefined:
      message = "Priority";
      break;
    case todoDetails.todo !== undefined:
      message = "Todo";
      break;
  }
  const getPreviousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  let previousTodo = await db.get(getPreviousTodoQuery);
  let updateTodoQuery = null;

  //console.log(previousTodo);

  //console.log(`${todo} ${priority} ${status}`);

  let {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  updateTodoQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}';`;

  await db.run(updateTodoQuery);
  response.send(`${message} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
