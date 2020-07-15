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
    body: JSON.stringify(body)
  };
};

module.exports.getCandidatos = async (event) => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  let queries = [
    /* municipal */
    'SELECT * FROM opendatadb.LISTADO_CANDIDATOS_MUNICIPALES_05_02_2020',
    /* congresional $ presidencial */
    'SELECT * FROM opendatadb.PRESIDENCIALES_CONGRESIONALES_2020'
  ];


  // Get Path Params
  let pathParameters = event['pathParameters'];
  // Log Params
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // Check if there's year and it's valid
    if (pathParameters.year){
      let year = parseInt(pathParameters.year);
      // if the year is not available, return message
      if (
        year !== 2020
      ){
        return global.exit(404, []);
      }
    }
  }

  // Make query
  let res_q = [];
  queries.forEach(query => {
    let queryStringParameters = event['queryStringParameters'];
    // Log Params
    console.log('Query Params: ', queryStringParameters);
    if (queryStringParameters){
      // Return if there's no value or query
      if ((!queryStringParameters.value || !queryStringParameters.value) && !queryStringParameters.start) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // If the start param has been passed (pagination)
      if (queryStringParameters.start){
        // Return if there's no value
        if (isNaN(queryStringParameters.start)) global.exit(400, []);
        // Return 50 records from the new start
        init.start = queryStringParameters.start;
      }
      // add del
      if (queryStringParameters.query){
        // Make query
        query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;  
        query += ` AND _del = 0`;
      } else {
        query += ` WHERE _del = 0`;
      }
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
      
    } else{
      // add del
      query += ` WHERE _del = 0`;
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
    }
  });

  // update queries
  queries = res_q;

  let municipal;
  try {
    municipal = await mysql.query(queries[0]);  
    municipal.push({ _length: municipal.length });
  } catch (error) {
    municipal = [{ statusMessage: 'bad-request' }];  
  }

  let presidencial;
  try {
    presidencial = await mysql.query(queries[1]);  
    presidencial.push({ _length: presidencial.length });
  } catch (error) {
    presidencial = [{ statusMessage: 'bad-request' }];  
  }

  let res_queries = [{
    municipal: municipal,
    presidencial: presidencial
  }];
  
  // Exit from lambda
  return global.exit(200, res_queries);  
};

module.exports.getMunicipales = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT * FROM opendatadb.LISTADO_CANDIDATOS_MUNICIPALES_05_02_2020
  `;

  // Get Path Params
  let pathParameters = event['pathParameters'];
  // Log Params
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // Check if there's year and it's valid
    if (pathParameters.year){
      let year = parseInt(pathParameters.year);
      // if the year is not available, return message
      if (
        year !== 2020
      ){
        return global.exit(404, []);
      }
    }
  }

  let queryStringParameters = event['queryStringParameters'];
  // Log Params
  console.log('Query Params: ', queryStringParameters);
  if (queryStringParameters){
    // If there's query available, filter by query value
    if (queryStringParameters.query){
      // Return if there's no value
      if (!queryStringParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // Make query
      query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (queryStringParameters.start){
      // Return if there's no value
      if (isNaN(queryStringParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = queryStringParameters.start;
    }

    // add del
    if (queryStringParameters.query){
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
  
  // Make query
  let results;
  try {
    results = await mysql.query(query); 
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }
  
};

module.exports.getPresidenciales = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT * FROM opendatadb.PRESIDENCIALES_CONGRESIONALES_2020
  `;

  // Get Path Params
  let pathParameters = event['pathParameters'];
  // Log Params
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // Check if there's year and it's valid
    if (pathParameters.year){
      let year = parseInt(pathParameters.year);
      // if the year is not available, return message
      if (
        year !== 2020
      ){
        return global.exit(404, []);
      }
    }
  }

  let queryStringParameters = event['queryStringParameters'];
  // Log Params
  console.log('Query Params: ', queryStringParameters);
  if (queryStringParameters){
    // If there's query available, filter by query value
    if (queryStringParameters.query){
      // Return if there's no value
      if (!queryStringParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // Make query
      query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (queryStringParameters.start){
      // Return if there's no value
      if (isNaN(queryStringParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = queryStringParameters.start;
    }

    // add del
    if (queryStringParameters.query){
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
  
  // Make query
  let results;
  try {
    results = await mysql.query(query); 
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }
  
};
