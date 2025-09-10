const { getThreeLeggedAuth } = require ("../../libs/auth/auth.three.legged.js")
const { getTwoLeggedAuth } = require ("../../libs/auth/auth.two.legged.js")

const FRONTEND_URL = process.env.FRONTEND_URL;

const  GetThreeLeggedAuth  = async (req, res) => {
    const { code } = req.query;

    try {
        const { token, cookieOptions } = await getThreeLeggedAuth(code);
        res.cookie("access_token", token, cookieOptions);
        return res.redirect(`${FRONTEND_URL}/platform`);
    }
    catch (err) {
        console.error("Error fetching three-legged token:", err);
        return res.redirect(`${FRONTEND_URL}/platform`);
    }
};

const GetTokenAuth = async (req, res) => {
    try {
        const { token } = await getTwoLeggedAuth(); 
        return res.status(200).json({
            data: { access_token: token },
            error: null,
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

const PostLogout = async (req, res) => {
    try {
        
        const cookieOptions = {
            httpOnly: true,
            path: "/",
        };

        if (process.env.NODE_ENV === "production") {
            cookieOptions.secure = true;
            cookieOptions.sameSite = "None";
            cookieOptions.domain = ".156041440121.cloud.bayer.com"; 
        } else {
            cookieOptions.secure = false;
            cookieOptions.sameSite = "Lax";
        }

        res.clearCookie("access_token", cookieOptions);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            message: "Error logging out",
            error: error.message,
        });
    }
};



module.exports = { GetThreeLeggedAuth, GetTokenAuth, PostLogout };
