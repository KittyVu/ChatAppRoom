import { DataTypes } from "sequelize";
import sequelize from "../libs/db.js";

const Room = sequelize.define("Room", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  roomname: { type: DataTypes.STRING, unique: true, allowNull: false },
});

export default Room;