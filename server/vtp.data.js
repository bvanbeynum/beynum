import data from "./vtp.schema.js";

export default {

	vtpUserGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
		if (request.query.token) {
			filter.token = request.query.token;
		}
		if (request.query.email) {
			filter.email = request.query.email;
		}

		data.vtpUser.find(filter)
			.lean()
			.exec()
			.then(vtpUsersData => {
				const vtpUsers = vtpUsersData.map(({ _id, __v, ...vtpUser }) => ({ id: _id, ...vtpUser }));
				response.status(200).json({ vtpUsers: vtpUsers });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	vtpUserSave: (request, response) => {
		if (!request.body.vtpuser) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const vtpUserSave = request.body.vtpuser;

		if (vtpUserSave.id) {
			data.vtpUser.findById(vtpUserSave.id)
				.exec()
				.then(vtpUserData => {
					if (!vtpUserData) {
						throw new Error("User not found");
					}

					Object.keys(vtpUserSave).forEach(field => {
						if (field != "id") {
							vtpUserData[field] = vtpUserSave[field];
						}
					})

					return vtpUserData.save();
				})
				.then(vtpUserData => {
					response.status(200).json({ id: vtpUserData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.vtpUser({ ...vtpUserSave })
				.save()
				.then(vtpUserData => {
					response.status(200).json({ id: vtpUserData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				})
		}
	},

	vtpUserDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.vtpUser.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	}

}
