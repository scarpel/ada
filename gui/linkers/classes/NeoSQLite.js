const Database = require("sqlite3").Database;

module.exports = class NeoSQLite{
  constructor(path, callback = () => {}){
    this.database = new Database(path, callback)
  };

  query(functionName, sql, params=[]){
    return new Promise((resolve, reject) => {
      this.database[functionName](sql, params, (err, data) => {
        if(err) reject(err);
        else resolve(data);
      })
    })
  };

  run(sql, params=[]){
    return this.query("run", sql, params)
  };

  get(sql, params = []){
    return this.query("get", sql, params)
  };

  all(sql, params = []){
    return this.query("all", sql, params)
  };

  prepare(sql){
    return this.database.prepare(sql)
  }

  close(){
    return this.database.close();
  }
};