import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./libs/app.db",   
  logging: false,       
});

export default sequelize;