export default (database, DataTypes) => {
    return database.define('Config', {
       guildId: {
           type: DataTypes.STRING,
           primaryKey: true,
           allowNull: false,
       },
       dailyPoints: {
           type: DataTypes.INTEGER,
           defaultValue: 10,
           allowNull: false,
       },
       dailyGifts: {
           type: DataTypes.INTEGER,
           defaultValue: 15,
           allowNull: false,
       },
       maxPoints: {
        type: DataTypes.INTEGER,
        defaultValue: -1,
        allowNull: false,
       },
       maxGifts: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        allowNull: false,
       },
       minorArtifactCost: {
           type: DataTypes.INTEGER,
           defaultValue: 50,
           allowNull: false,
       },
       majorArtifactCost: {
           type: DataTypes.INTEGER,
           defaultValue: 200,
           allowNull: false,
       },
   }, {
       timestamps: false,
   })
   }
   
   