export default (database, DataTypes) => {
 return database.define('Users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    dailyCooldown: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    weeklyCooldown: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'guildId']
        }
    ]
})
}

