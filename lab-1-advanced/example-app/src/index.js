const express = require('express')
require('dotenv').config()
const app = express()

const { pool } = require("./db");

app.get('/', (req, res) => {
  if (req.query['password'] == process.env.PASSWORD) {
    res.send('Secret meeting location is 45.0723309,39.0377339')
  } else {
    res.send('Hi <3\n')
  }
})

app.listen(3000, () => {
  try {
    pool.query(
      "INSERT INTO startup_logs (argument) VALUES ($1)",
      [process.argv[2]]
    );
  } catch (error) {
    console.error(error)
  }
  console.log('Server started on port 3000.');
})