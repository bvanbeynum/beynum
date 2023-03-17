import React from "react";

const Logs = props => {

	return (
		<div className="codePanel">
		{
		props.logs.length === 0 ?

		<div style={{ alignSelf: "center", justifySelf: "center", fontSize: "18px" }}>No recent logs</div>

		:

		props.logs
			.sort((logA, logB) => logB.logTime - logA.logTime)
			.map((log, logIndex) =>

			<div key={ logIndex }>
				{ `${log.dateTime} ${ (log.app || "") + (log.app && log.module ? "." : "") + (log.module || "") + (log.module && log.function ? "." : "") + (log.function || "")}: ${ log.message }` }
			</div>
		)}
		</div>
	)

};

export default Logs;