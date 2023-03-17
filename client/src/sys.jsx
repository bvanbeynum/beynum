import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import JobComponent from "./sys/jobs.jsx";
import LogComponent from "./sys/logs.jsx";
import "./media/sys.css";

class Sys extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			page: "selector",
			toast: { message: "", type: "info" }
		};
	};

	viewLogs = () => {
		this.setState({ isLoading: true }, () => {
			fetch(`/sys/api/getrecentlogs`)
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					this.setState({
						logs: data.logs.map(log => ({...log, logTime: new Date(log.logTime) })),
						isLoading: false,
						page: "logs"
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading jobs", type: "error" } });
				})
		});
	};

	viewJobs = () => {
		this.setState({ isLoading: true }, () => {
			fetch(`/sys/api/getjobs`)
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					this.setState({
						jobs: data.jobs
							.map(job => ({
								...job,
								frequency: 
									job.frequencySeconds >= 3600 ? Math.floor(job.frequencySeconds / 3600) + "h " : "" +
									job.frequencySeconds % 3600 !== 0 ? Math.floor((job.frequencySeconds % 3600) / 60) + "m " : "" +
									job.frequencySeconds % 60 !== 0 ? job.frequencySeconds % 60 + "s" : "",
								runs: job.runs
									.sort((runA, runB) => new Date(runB.completeTime) - new Date(runA.completeTime))
									.map((run, runIndex, runArray) => {
										const output = {
											...run,
											completeTime: run.completeTime ? new Date(run.completeTime) : null,
											complete: run.completeTime ? (new Date(run.completeTime)).toLocaleDateString() + " " + (new Date(run.completeTime)).toLocaleTimeString() : "",
											difference: runIndex === runArray.length - 1 ? 0
												: new Date(run.completeTime) - new Date(runArray[runIndex + 1].completeTime)
										};

										return {
											...output,
											difference: runIndex === 0 ? output.complete
												: (
													"+" + (
													output.difference >= 3600000 ? Math.floor(output.difference / 3600000) + "h " : "" +
													output.difference % 3600000 !== 0 ? Math.floor((output.difference % 3600000) / 60000) + "m " : "" +
													output.difference % 60000 !== 0 ? Math.floor(output.difference % 60000)  + "s": ""
													) + " " + output.complete
												)
										}
									})
							}))
							.sort((jobA, jobB) => 
								jobA.runs && jobB.runs ?
									jobB.runs.reduce((output, current) => current.completeTime > output ? current.completeTime : output, new Date(2022,0,1)) - jobA.runs.reduce((output, current) => current.completeTime > output ? current.completeTime : output, new Date(2022,0,1))
								: jobA.runs ? -1
								: 1
							),
						isLoading: false,
						page: "jobs"
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading jobs", type: "error" } });
				});
		});
	};

	render() { return (
		<div className="page">
			{
			this.state.isLoading ?
				<div className="loading">
					<img alt="Loading" src="/media/beynum.png" />
				</div>
			:
			
			<>
				<div className="buttonContainer">
					<div className="button" onClick={ this.viewJobs }>Jobs</div>
					<div className="button" onClick={ this.viewLogs }>Logs</div>
				</div>
				
				{
				this.state.page === "jobs" ?
				<JobComponent jobs={ this.state.jobs } />
				: this.state.page === "logs" ?
				<LogComponent logs={ this.state.logs } />
				:
				""
				}
			</>

			}
			<Toast message={ this.state.toast } />
		</div>
	)};

}

ReactDOM.render(<Sys />, document.getElementById("root"));
