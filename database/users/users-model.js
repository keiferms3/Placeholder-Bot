export default (database, DataTypes) => {
 return database.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    gifts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
}, {
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['userid', 'guildid']
        }
    ]
})
}

