const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//registeruser
app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body

  let hashedPassword = await bcrypt.hash(password, 10)
  console.log(hashedPassword)

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`
  let userData = await db.get(checkTheUsername)
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postNewUserQuery)
      console.log(newUserDetails)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//login

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    console.log(dbUser)
    console.log(dbUser.password)
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

//change-password
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  select_query = `SELECT * FROM user WHERE username="${username}";`
  const isuserpresent = await db.get(select_query)

  if (isuserpresent === undefined) {
    response.status = 400
    response.send('User not registered')
  } else {
    const isenteredpasswordcorrect = await bcrypt.compare(
      oldPassword,
      isuserpresent.password,
    )

    console.log(isenteredpasswordcorrect)
    if (isenteredpasswordcorrect === false) {
      response.status = 400
      response.send('Invalid current password')
    } else {
      console.log(newPassword.length < 5)
      if (newPassword.length < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const hashedpass = await bcrypt.hash(newPassword, 10)

        const password_update_query = `UPDATE user SET password="${hashedpass}"
      WHERE username="${username}";`

        console.log(password_update_query)
        await db.run(password_update_query)

        response.status = 200
        response.send('Password updated')
      }
    }
  }
})

//delete
app.delete('/deleteuser/', async (request, response) => {
  const {username} = request.body
  const deleteQuery = `DELETE FROM user WHERE username="${username}"`

  await db.run(deleteQuery)
  response.send("User `${username}' deleted")
})

//get
app.get('/getallusers/', async (request, response) => {
  const getquery = `SELECT * FROM user;`

  const usersArray = await db.all(getquery)
  response.send(usersArray)
})

module.exports = app
