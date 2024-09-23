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
        gachaRollCost: {
            type: DataTypes.INTEGER,
            defaultValue: 20,
            allowNull: false,
        },
        perChanceT1: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
            allowNull: false,
        },
        maxChanceT1: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            allowNull: false,
        },
        perChanceT2: {
            type: DataTypes.INTEGER,
            defaultValue: 3,
            allowNull: false,
        },
        maxChanceT2: {
            type: DataTypes.INTEGER,
            defaultValue: 15,
            allowNull: false,
        },
        perChanceT3: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
        maxChanceT3: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
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
   }, {
       timestamps: false,
   })
   }
   
   