import data from "./beynum.schema.js";

export default {

	userGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}
		if (request.query.usertoken) {
			filter["tokens"] = request.query.usertoken
		}
		if (request.query.devicetoken) {
			filter["devices.token"] = request.query.devicetoken
		}
		if (request.query.email) {
			filter["email"] = request.query.email;
		}

		data.user.find(filter)
			.lean()
			.exec()
			.then(usersData => {
				const users = usersData.map(({ _id, __v, ...user }) => ({ id: _id, ...user }));
				response.status(200).json({ users: users });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	userSave: (request, response) => {
		if (!request.body.user) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const userSave = request.body.user;

		if (userSave.id) {
			data.user.findById(userSave.id)
				.exec()
				.then(userData => {
					if (!userData) {
						throw new Error("User not found");
					}

					Object.keys(userSave).forEach(field => {
						if (field != "id") {
							userData[field] = userSave[field];
						}
					})

					return userData.save();
				})
				.then(userData => {
					response.status(200).json({ id: userData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.user({ ...userSave })
				.save()
				.then(userData => {
					response.status(200).json({ id: userData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				})
		}
	},

	userDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.user.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	jobGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}

		data.job.find(filter)
			.lean()
			.exec()
			.then(jobsData => {
				const jobs = jobsData.map(({ _id, __v, ...job }) => ({ id: _id, ...job }));
				response.status(200).json({ jobs: jobs });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	jobSave: (request, response) => {
		if (!request.body.job) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const jobSave = request.body.job;

		if (jobSave.id) {
			data.job.findById(jobSave.id)
				.exec()
				.then(jobData => {
					if (!jobData) {
						throw new Error("Record not found");
					}

					Object.keys(jobSave).forEach(field => {
						if (field != "id") {
							jobData[field] = jobSave[field];
						}
					});
					jobData.modified = new Date();

					return jobData.save();
				})
				.then(jobData => {
					response.status(200).json({ id: jobData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.job({ ...jobSave, created: new Date(), modified: new Date() })
				.save()
				.then(jobData => {
					response.status(200).json({ id: jobData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				});
		}
	},

	jobDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.job.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	}

}