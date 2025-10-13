import { DataTypes } from "sequelize";
import sequelize from "../libs/db.js";
import User from "./User.js";
import Room from "./Room.js";

const Message = sequelize.define("Message", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  senderUsername: { type: DataTypes.STRING, allowNull: false },
  roomId: {type: DataTypes.INTEGER, allowNull: false},
});

Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Message.belongsTo(Room, { as: "room", foreignKey:"roomId"} );

export default Message;