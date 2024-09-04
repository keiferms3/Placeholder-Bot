export default (database, DataTypes) => {
    return database.define('artifacts', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING
        }
   }, {
        timestamps: false,
   })
   }
   
   