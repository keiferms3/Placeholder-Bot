export default (database, DataTypes) => {
 return database.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
}, {
    timestamps: false,
})
}

