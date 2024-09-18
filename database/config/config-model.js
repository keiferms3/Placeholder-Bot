export default (database, DataTypes) => {
    return database.define('Config', {
        guildId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        dailyPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 20,
            allowNull: false,
        },
        weeklyPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
        maxPoints: {
            type: DataTypes.INTEGER,
            defaultValue: -1,
            allowNull: false,
        },
        embedColor: {
            type: DataTypes.STRING,
            defaultValue: `#853fb5`,
            allowNull: false,
        },
        trinketCostT1: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        trinketCostT2: {
            type: DataTypes.INTEGER,
            defaultValue: 200,
            allowNull: false,
        },
        trinketCostT3: {
            type: DataTypes.INTEGER,
            defaultValue: 500,
            allowNull: false,
        },
        shopTrinket: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            allowNull: false,
        },
        shopMessage: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
   }, {
       timestamps: false,
   })
   }
   
   