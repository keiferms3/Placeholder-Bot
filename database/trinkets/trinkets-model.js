export default (database, DataTypes) => {
    return database.define('Trinkets', {
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
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
   }, {
        timestamps: false,
   })
   }
   
   