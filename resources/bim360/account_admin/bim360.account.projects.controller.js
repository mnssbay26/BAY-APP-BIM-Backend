const { default: axios } = require("axios");

const { authorizedHub } = require("../../../const/hubs.const.js");

const GetProjects = async (req, res) => {
    const token = req.cookies["access_token"];

    if (!token) {
        return res.status(401).json({
            data: null,
            error: "Unauthorized",
            message: "Unauthorized",
        });
    }

    try{
        const { data: hubsdata } = await axios.get(
              "https://developer.api.autodesk.com/project/v1/hubs",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
        
            const targetHubs = hubsdata.data.filter((hub) =>
              authorizedHub.some((authHub) => authHub.id === hub.id)
            );
        
            if (!targetHubs.length) {
              return res.status(404).json({
                data: null,
                error: "Hub not found",
                message: "Not auuthorized hub found",
              });
            }
        
            const projects = targetHubs.map((hub) => {
              return axios
                .get(
                  `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                )
                .then((response) => response.data.data)
                .catch((error) => {
                  console.error(
                    `Error fetching projects for hub ${hub.id}:`,
                    error.message || error
                  );
                  return [];
                });
            });
        
            const projectsList = await Promise.all(projects);
        
            const allProjects = projectsList.flat();
        
            //console.log ('All Projects',allProjects)
        
            const accProjects = allProjects.filter(
              (project) =>
                project.attributes &&
                project.attributes.extension &&
                project.attributes.extension.data &&
                project.attributes.extension.data.projectType === "BIM360"
            );
        
            res.status(200).json({
              data: {
                projects: accProjects,
              },
              error: null,
              message: "Access to BIM360 proyects",
            });


    }catch (error) {
        console.error("Error fetching project:", error.message || error);
        return res.status(500).json({
            data: null,
            error: "Internal Server Error",
            message: "Error fetching project",
        });
    }

}

module.exports = {
    GetProjects,
}