import React from "react";

const Logs = props => {

	return (
		<div className="codePanel">
		{
		props.logs.length === 0 ?

		<div style={{ alignSelf: "center", justifySelf: "center", fontSize: "18px" }}>No recent logs</div>

		:

		props.logs.map((log, logIndex) =>
			<div key={ logIndex } className="error">
				{ `${log.logTime}: ${ log.app + "." || "" }${ log.module + "." || "" }${ log.function} • ${ log.message }` }
			</div>
		)}
		</div>
	)

};

export default Logs;