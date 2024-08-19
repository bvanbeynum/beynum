import React, { useState } from "react";

const Jobs = props => {

	const [ expandedRunList, setExpandedRunList ] = useState([]);

	const expandRun = runId => {
		if (expandedRunList.includes(runId)) {
			setExpandedRunList(expandedRunList.filter(existing => existing !== runId));
		}
		else {
			setExpandedRunList(expandedRunList.concat(runId));
		}
	};

	return (
		<div className="panelContainer">

		{
		props.jobs.map((job) => 
			
			<div key={ job.id } className="panel">
				<h2>{ job.name }</h2>

				<div className="flexSplit">
					<div style={{ minWidth: "150px" }}>
						<div className="info">
							<div className="label">Script</div>
							<div className="data">{ job.scriptName }</div>
						</div>
						
						<div className="info">
							<div className="label">Frequency</div>
							<div className="data">{ job.frequency }</div>
						</div>

						<div className="info">
							<div className="label">Status</div>
							<div className="data">{ job.status }</div>
						</div>
					</div>

					<div className="seperator"></div>
					
					<div style={{ flex: 1 }}>
						<h3>Runs</h3>

						<div>
							{
							job.runs.map((run) =>
							<div key={run._id} className="listItem expandable clickable" onClick={ () => expandRun(run._id) }>
								<div className={ run.messages.some(message => message.severity > 0) ? "error" : "" }>{ run.completeTime ? run.difference : "running" }</div>
								
								{
								expandedRunList.includes(run._id) ?

								<div className="codePanel">
									{
									run.messages.map((message, messageIndex) =>
									<div key={ messageIndex } className={ message.severity > 0 ? "error" : "" }>{ message.message }</div>
									)
									}
								</div>

								:""
								}
							</div>
							)
							}
						</div>
					</div>
				</div>
			</div>

		)
		}

		</div>
	);

}

export default Jobs;