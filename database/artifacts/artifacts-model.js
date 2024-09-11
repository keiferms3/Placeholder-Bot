export default (database, DataTypes) => {
    return database.define('Artifacts', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        },
        owner: {
            type: DataTypes.STRING,
            allowNull: true,
        },
   }, {
        timestamps: false,
   })
   }
   
   