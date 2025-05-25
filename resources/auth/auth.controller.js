const axios = require("axios")

const {GetAPSThreeLeggedToken,
    GetAPSToken,} = require("../../utils/auth/auth.utils.js")

const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173"

const GetThreeLeggedAuth = async (req, res) => {
    const {code} = req.query

    try {
        const token = await GetAPSThreeLeggedToken(code)
        
        res.cookie ("access_token", token, {
            maxAge: 360000000,
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
        })

        return res.redirect (`${frontend_url}/platform`)
    } catch (error) {
        console.error ("Error geting Three Legged:", error)
        return res.redirect (`${frontend_url}/platform`)
    }
}

const GetTokenAuth = async (req, res) => {
    try {
        const token = await GetAPSToken ();
        res.status(200).json (
    {
        data: {
            access_token: token,
        },
        error: null,
        message: "Token generated correctly"
    })
    } catch (error) {
        res.status(500).json({
            data:null,
            error:null,
            message: "Token error",
        })
    }
}

module.exports = {
    GetThreeLeggedAuth,
    GetTokenAuth
}



