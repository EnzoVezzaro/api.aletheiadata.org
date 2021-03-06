"use strict";

// Require and initialize outside of your main handler
const mysql = require('serverless-mysql')({
  config: {
    host     : process.env.ENDPOINT,
    port     : process.env.PORT,
    database : process.env.DATABASE,
    user     : process.env.USERNAME,
    password : process.env.PASSWORD
  }
});

global.exit = (code, body) =>{
  
  if (!code || !body) {
    code = 500,
    body = [{
      statusMessage: 'internal-error'
    }];
  } if (code == 400) {
    code = 400,
    body = [{
      statusMessage: 'bad-request'
    }];
  } if (code == 800) {
    code = 800,
    body = [{
      statusMessage: 'i stay warmed'
    }];
  } else {
    if (body.length === 0) {
      code = 404,
      body = [{
        statusMessage: 'not-found'
      }];
    } 
  }

  body.push({
    _length: body.length
  });

  // Run close connection
  mysql.quit();
  
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere 
      "Access-Control-Allow-Methods": "GET" // Allow only GET request 
    },
    body: JSON.stringify(body)
  };
};

module.exports.getPartidos = async (event) => {
  console.log('Event: ', event);

  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return global.exit(800, []);
  }

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `SELECT * FROM opendatadb.PARTIDOS_07_2020`;

  // Get Path Params
  let pathParameters = event['queryStringParameters'];
  // Log query
  console.log('Path Params: ', pathParameters);
  if (pathParameters){

    // If there's query available, filter by query value
    if (pathParameters.query){
      // Return if there's no value
      if (!pathParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(pathParameters.value);
      // Make query
      query += ` WHERE ${pathParameters.query} like '%${pathParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (pathParameters.start){
      // Return if there's no value
      if (isNaN(pathParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = pathParameters.start;
    }

    // add del
    if (pathParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
  } else {
    // add del
    query += ` WHERE _del = 0`;
  } 

  // add limit
  query += ` LIMIT ${init.start},${init.limit};`;

  // Log query
  console.log('Query: ', query);
  
  let results;
  try {
    results  = await mysql.query(query);  
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }

};