const express = require('express')
const app = express()

app.get('/', (req, res) => {
  if (req.query['password'] == process.env.PASSWORD) {
    res.send('Secret meeting location is 45.0723309,39.0377339')
  } else {
    res.send('Hi <3\n')
  }
  console.log(process.env.PASSWORD)
})

app.listen(3000, () => {
  console.log('server started on port 3000');
})