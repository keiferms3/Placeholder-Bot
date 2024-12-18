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
        maxPoints: { // Negative number for no max
            type: DataTypes.INTEGER,
            defaultValue: -1,
            allowNull: false,
        },
        embedColor: {
            type: DataTypes.STRING,
            defaultValue: '#853fb5',
            allowNull: false,
        },
        trinketCostT1: {
            type: DataTypes.INTEGER,
            defaultValue: 20,
            allowNull: false,
        },
        trinketCostT2: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
        trinketCostT3: {
            type: DataTypes.INTEGER,
            defaultValue: 300,
            allowNull: false,
        },
        eightBallCost: { //TODO?
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
        gachaRollCost: {
            type: DataTypes.INTEGER,
            defaultValue: 20,
            allowNull: false,
        },
        perChanceT1: {
            type: DataTypes.DOUBLE,
            defaultValue: 5,
            allowNull: false,
        },
        maxChanceT1: {
            type: DataTypes.DOUBLE,
            defaultValue: 50,
            allowNull: false,
        },
        minChanceT1: {
            type: DataTypes.DOUBLE,
            defaultValue: 20,
            allowNull: false,
        },
        perChanceT2: {
            type: DataTypes.DOUBLE,
            defaultValue: 3,
            allowNull: false,
        },
        maxChanceT2: {
            type: DataTypes.DOUBLE,
            defaultValue: 15,
            allowNull: false,
        },
        minChanceT2: {
            type: DataTypes.DOUBLE,
            defaultValue: 5,
            allowNull: false,
        },
        perChanceT3: {
            type: DataTypes.DOUBLE,
            defaultValue: 0.2,
            allowNull: false,
        },
        maxChanceT3: {
            type: DataTypes.DOUBLE,
            defaultValue: 3,
            allowNull: false,
        },
        minChanceT3: {
            type: DataTypes.DOUBLE,
            defaultValue: 1,
            allowNull: false,
        },
        rarityNameT1: {
            type: DataTypes.STRING,
            defaultValue: 'Common',
            allowNull: false,
        },
        rarityNameT2: {
            type: DataTypes.STRING,
            defaultValue: 'Rare',
            allowNull: false,
        },
        rarityNameT3: {
            type: DataTypes.STRING,
            defaultValue: 'Legendary',
            allowNull: false,
        },
        forgeRewardRatio: {
            type: DataTypes.DOUBLE,
            defaultValue: 1.0,
            allowNull: false,
        },
        forgeRewardDailyT1: {
            type: DataTypes.DOUBLE,
            defaultValue: 0.1,
            allowNull: false,
        },
        forgeRewardDailyT2: {
            type: DataTypes.DOUBLE,
            defaultValue: 0.05,
            allowNull: false,
        },
        forgeRewardDailyT3: {
            type: DataTypes.DOUBLE,
            defaultValue: 0.03,
            allowNull: false,
        },
        forgeRewardMaxInterestMultiplier: {
            type: DataTypes.DOUBLE,
            defaultValue: 6.0,
            allowNull: false,
        },
        returnRatioT1: {
            type: DataTypes.DOUBLE,
            defaultValue: 1.0,
            allowNull: false,
        },
        returnRatioT2: {
            type: DataTypes.DOUBLE,
            defaultValue: 1.0,
            allowNull: false,
        },
        returnRatioT3: {
            type: DataTypes.DOUBLE,
            defaultValue: 1.0,
            allowNull: false,
        },
        destroyRatio: { //TODO 
            type: DataTypes.DOUBLE,
            defaultValue: 1.0,
            allowNull: false,
        },
        gamblingDiceNames: {
            type: DataTypes.STRING,
            defaultValue: '1,2,3,4,5,6',
            allowNull: false,
        },
   }, {
       timestamps: false,
   })
   }
   
   