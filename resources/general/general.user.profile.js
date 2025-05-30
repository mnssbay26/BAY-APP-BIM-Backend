const axios = require('axios');

/**
 * Controller to fetch the authenticated user's profile from Autodesk APS.
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetUserProfile = async (req, res) => {
  // Extract access token from HTTP-only cookie
  const token = req.cookies['access_token'];

  if (!token) {
  return res
    .status(401)
    .json({ data: null, error: 'Unauthorized', message: 'No token' });
}

  //console.log('token:', token);

  try {
    const { data } = await axios.get(
      'https://developer.api.autodesk.com/userprofile/v1/users/@me',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    //console.log('User profile retrieved:', data);

    return res.status(200).json({
      data: data,
      error: null,
      message: 'User profile retrieved successfully',
    });
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    if (err.response) {
      console.error('Autodesk response:', err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: 'Failed to retrieve user profile',
    });
  }
};

module.exports = { GetUserProfile };
