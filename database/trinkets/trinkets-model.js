export default (database, DataTypes) => {
    return database.define('Trinkets', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        trinketId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0, //Default value purely for migration purposes, remove later
        },
        tier: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        creatorId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hidden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        returned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
   }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['trinketId', 'guildId']
            }
        ]
   })
   }
   
   