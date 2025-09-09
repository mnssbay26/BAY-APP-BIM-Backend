const { getThreeLeggedAuth } = require ("../../libs/auth/auth.three.legged.js")
const { getTwoLeggedAuth } = require ("../../libs/auth/auth.two.legged.js")

const FRONTEND_URL = process.env.FRONTEND_URL;

const  GetThreeLeggedAuth  = async (req, res) => {
    const { code } = req.query;

    try {
        await getThreeLeggedAuth(code);
        return res.redirect(`${FRONTEND_URL}/platform`);
    }
    catch (err) {
        console.error("Error fetching three-legged token:", err);
        return res.redirect(`${FRONTEND_URL}/platform`);
    }
};

const GetTokenAuth = async (req, res) => {
    try {
        await getTwoLeggedAuth();
        return res.status(200).json({
            message: "Two-legged token generated successfully",
        });
    }
    catch (err) {
        console.error("Error generating two-legged token:", err);
        return res.status(500).json({
            error: err.message,
            message: "Failed to generate token",
        });
    }
};
module.exports = { GetThreeLeggedAuth, GetTokenAuth };
