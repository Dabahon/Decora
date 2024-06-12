const Follow = require("../models/follow");

// Metodo que te devuelve que usuarios sigues  y te siguen
const followUserIds = async (identityUserId) => {
    try {
        // Scar información de seguimiento
        const following = await Follow.find({ "user": identityUserId })
            .select({ "followed": 1, "_id": 0})
            .exec();

        const followers = await Follow.find({ "followed": identityUserId })
            .select({ "user": 1, "_id": 0})
            .exec();

        return {
            following: following.map(f => f.followed),
            followers: followers.map(f => f.user)
        };
    } catch (error) {
        return {
            following: [],
            followers: []
        };
    }
};

// Metodo para comprobar si sigues al usuario
const followThisUser = async (identityUserId, profileUserId) => {
    try {
        // Consultar si identityUserId sigue a profileUserId
        const following = await Follow.findOne({"user": identityUserId, "followed": profileUserId});

        // Consultar si profileUserId sigue a identityUserId
        const follower = await Follow.findOne({"user": profileUserId, "followed": identityUserId});
        
        return {
            following,
            follower
        };
    } catch (error) {
        console.error("Error checking follow status:", error);
        return {
            following: false,
            follower: false
        };
    }
};

module.exports = {
    followUserIds,
    followThisUser
};
