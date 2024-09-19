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
        trinketT1Cost: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            allowNull: false,
        },
        trinketT2Cost: {
            type: DataTypes.INTEGER,
            defaultValue: 200,
            allowNull: false,
        },
        trinketT3Cost: {
            type: DataTypes.INTEGER,
            defaultValue: 500,
            allowNull: false,
        },
        eightBallCost: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
        dialogueCost: {
            type: DataTypes.INTEGER,
            defaultValue: 200,
            allowNull: false,
        },
        dialogueReplaceCost: {
            type: DataTypes.INTEGER,
            defaultValue: 1000,
            allowNull: false,
        },
   }, {
       timestamps: false,
   })
   }
   
   