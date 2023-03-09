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
    }

};
