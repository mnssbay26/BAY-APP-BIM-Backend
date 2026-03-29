const { getProjectCompanies } = require("../../libs/acc/account_admin/get.project.companies");
const { getTwoLeggedAuth } = require("../../libs/auth/auth.two.legged");

const GetProjectCompanies = async (req, res) => {
  const accountId = req.params.accountId;
  let projectId = req.params.projectId;

  if (projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  try {
    const { token } = await getTwoLeggedAuth();


    const companies = await getProjectCompanies(token,accountId, projectId);

    return res.status(200).json({
      data: { companies },
      error: null,
      message: "Companies retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching project companies:", err.message);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve companies",
    });
  }
};

module.exports = { GetProjectCompanies };
