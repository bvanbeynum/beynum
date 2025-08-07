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
            clientResponse = await client.post(`${ request.serverPath }/sys/data/log`).send({ log: request.body.log });
        }
        catch (error) {
			response.statusMessage = error.message;
			response.status(561).json({ location: "Add log", error: error.message });
			return;
        }

        response.status(200).json({ status: "ok" });
    },

	getRecentLogs: async (request, response) => {
		let clientResponse = null;

		try {
			clientResponse = await client.get(`${ request.serverPath }/sys/data/log`);
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6414988550d65e1385d46cea", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ location: "Get Recent Logs", error: error.message });
			return;
		}

		const output = {
			logs: clientResponse.body.logs.filter(log => (new Date()) - (new Date(log.logTime)) < (1000 * 60 * 60 * 24 * 5))
		};

		try {
			clientResponse = await client.get(`${ request.serverPath }/sys/data/logtype`);
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6414988550d65e1385d46cea", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Get Recent Logs", error: error.message });
			return;
		}

		output.logs = output.logs.map(log => ({ ...log, ...clientResponse.body.logTypes.find(logType => logType.id === log.logTypeId)}))

		response.status(200).json(output);
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
		console.log(`${ (new Date()).toLocaleString() }: SaveJobRun - Job ID: ${ request.query.jobid }, Run: ${ JSON.stringify(request.body.jobrun) }`);

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

		// Only keep last 10 runs
		job.runs = job.runs
			.sort((runA, runB) => runA.completeTime && runB.completeTime ? (new Date(runB.completeTime)) - (new Date(runA.completeTime)) : runA.completeTime && !runB.completeTime ? 1 : -1)
			.filter((run, runIndex) => !run.completeTime || runIndex === 0 || (run.messages && run.messages.length > 0))
			.slice(0,10)
			.map(run => ({
				...run,
				completeTime: run.completeTime ? 
					new Date(run.completeTime)
					: new Date() > new Date(new Date(run.startTime).setSeconds(job.frequencySeconds > 300 ? job.frequencySeconds : 300)) ? new Date() 
					: null
			}));
		
		const jobRunsWithoutMessages = job.runs.map(({ messages, ...run}) => run);

		console.log(`${ (new Date()).toLocaleString() }: SaveJobRun - runs: ${ JSON.stringify(jobRunsWithoutMessages) }`);

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
			run = clientResponse.body.jobs[0].runs.filter(run => !run.completeTime)[0];
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
	},

	getUrlStatusList: async (request, response) => {
		let clientResponse = null;

		try {
			clientResponse = await client.get(`${ request.serverPath }/sys/data/urlstatus`)
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b5b5011ba6e2962e58bba", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ error: error.message });
		}
		
		const output = {
			urlStatusList: clientResponse.body.urlStatusList
		};

		response.status(200).json(output);
	}

};
