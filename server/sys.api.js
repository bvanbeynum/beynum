import client from "superagent";

export default {

    addLog: async (request, response) => {
		if (!request.body.log) {
			response.statusMessage = "Missing log";
			response.status(560).json({ location: "Initialization", error: "Missing log" });
			return;
		}

        let clientResponse = null;

        try {
            clientResponse = await client.post(`${ request.serverPath }/sys/data/log`).send(request.body.log );
        }
        catch (error) {
			response.statusMessage = error.message;
			response.status(561).json({ location: "Add log", error: error.message });
			return;
        }

        response.status(200).json({ status: "ok" });
    },

	getJobs: (request, response) => {
		client.get(`${ request.serverPath }/sys/data/job`)
			.then(clientResponse => {
				const output = {
					jobs: clientResponse.body.jobs
				};

				response.status(200).json(output);
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4d9d743f6b08b4402950", message: `561: ${error.message}` }});
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			});
	},

	saveJobRun: async (request, response) => {
		if (!request.query.jobid || !request.body.jobrun) {
			response.statusMessage = "Missing object to save";
			response.status(561).json({ error: "Missing object to save" });
			return;
		}

		let clientResponse = null;
		try {
			clientResponse = await client.get(`${ request.serverPath }/sys/data/job?id=${ request.query.jobid }`);
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4dc2743f6b08b4402952", message: `562: ${error.message}` }});
			response.statusMessage = "Error pulling job details";
			response.status(562).json({ location: "Pull job details", error: error.message });
			return;
		}

		const job = clientResponse.body.jobs[0],
			saveRun = request.body.jobrun;

		if (saveRun["_id"]) {
			job.runs = job.runs.map(run => {
				return run["_id"] == saveRun["_id"] ? saveRun : run
			});
		}
		else {
			job.runs.push(saveRun);
		}

		try {
			clientResponse = await client.post(`${ request.serverPath }/sys/data/job`).send({ job: job });
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4dc2743f6b08b4402952", message: `563: ${error.message}` }});
			response.statusMessage = "Error saving job";
			response.status(563).json({ location: "Save job", error: error.message });
			return;
		}

		try {
			clientResponse = await client.get(`${ request.serverPath }/sys/data/job?id=${ job.id }`);
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4dc2743f6b08b4402952", message: `564: ${error.message}` }});
			response.statusMessage = "Error loading job";
			response.status(564).json({ location: "Pull saved job", error: error.message });
			return;
		}

		let run = null;
		if (saveRun["_id"]) {
			run = clientResponse.body.jobs[0].runs.find(run => run["_id"] == saveRun["_id"]);
		}
		else {
			run = clientResponse.body.jobs[0].runs[clientResponse.body.jobs[0].runs.length - 1];
		}

		response.status(200).json({ run: run });
	},

	getRun: (request, response) => {
		if (!request.query.jobid && !request.query.runid) {
			response.statusMessage = "Missing required information";
			response.status(561).json({ error: "Missing required information" });
			return;
		}

		client.get(`${ request.serverPath }/sys/data/job?id=${ request.query.jobid }`)
			.then(clientResponse => {
				const output = {
					run: clientResponse.body.jobs.flatMap(job => job.runs).find(run => run["_id"] == request.query.runid)
				};
				response.status(200).json(output)
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4e07743f6b08b4402955", message: `562: ${error.message}` }});
				response.statusMessage = error.message;
				response.status(562).json({ error: error.message });
			});
	}

};
