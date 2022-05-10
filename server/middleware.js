export default  {

	loadSetup: (request, response, next) => {
		request.serverPath = `${ request.protocol }://${ request.headers.host }`;

		next();
	}

}