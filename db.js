const Client = require('pg').Client
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'admin',
    port: 5432,
  })

const fn = async ()=>{

    await client.connect()

    const createTableText = `
    CREATE TABLE conversations(
      id INTEGER PRIMARY KEY,
      sender text,
      message text,
      response text
    )`
    // create our temp table
    await client.query(createTableText).then(val=>{
        console.log(val);
    })

    // const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    // console.log(res.rows[0].message) // Hello world!
    await client.end()
}
 
fn()