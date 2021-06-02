import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./media/commandcenter.css";

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			lastUpdate: new Date(),
			timespan: "day",
			sensorLogs: [],
			toast: { text: "", isActive: false, type: "info" },
			controls: [
				{ name: "Fan", canControl: true, isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M14.5,17c0,1.65-1.35,3-3,3s-3-1.35-3-3h2c0,0.55,0.45,1,1,1s1-0.45,1-1s-0.45-1-1-1H2v-2h9.5 C13.15,14,14.5,15.35,14.5,17z M19,6.5C19,4.57,17.43,3,15.5,3S12,4.57,12,6.5h2C14,5.67,14.67,5,15.5,5S17,5.67,17,6.5 S16.33,8,15.5,8H2v2h13.5C17.43,10,19,8.43,19,6.5z M18.5,11H2v2h16.5c0.83,0,1.5,0.67,1.5,1.5S19.33,16,18.5,16v2 c1.93,0,3.5-1.57,3.5-3.5S20.43,11,18.5,11z"/></svg> },
				{ name: "Light", isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg>, },
				{ name: "Door", isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M14 6v15H3v-2h2V3h9v1h5v15h2v2h-4V6h-3zm-4 5v2h2v-2h-2z"/></svg> },
				{ name: "Motion", isActive: false, icon: <svg viewBox="0 0 24 24"><g><circle cx="12" cy="4" r="2"/><path d="M15.89,8.11C15.5,7.72,14.83,7,13.53,7c-0.21,0-1.42,0-2.54,0C8.24,6.99,6,4.75,6,2H4c0,3.16,2.11,5.84,5,6.71V22h2v-6h2 v6h2V10.05L18.95,14l1.41-1.41L15.89,8.11z"/></g></svg> }
			]
		};
	}

	componentDidMount() {
		fetch(`/api/commandcenterload?timespan=${ this.state.timespan }`)
			.then(response => response.json())
			.then(responseData => {
				const sensorLogs = responseData.sensorLogs
						.map(({ logTime, ...log }) => ({ logTime: new Date(logTime), ...log }))
						.sort((logA, logB) => logA.logTime - logB.logTime),
					lastLog = sensorLogs[sensorLogs.length - 1];

				this.setState(({ controls }) => {
					return {
					controls: controls.map(({ isActive, ...control }) => ({
						isActive: (control.name === "Fan" && lastLog.isFanOn) ||
							(control.name === "Light" && lastLog.isLight) ||
							(control.name === "Door" && lastLog.isDoorOpen) ||
							(control.name === "Motion" && lastLog.hasMotion),
						...control
					})),
					sensorLogs: sensorLogs
					}
				});
			});
	}

	buttonAction = (control) => {
		if (control.name === "Fan") {
			const command = { type: "fan", status: !control.isActive };
			console.log(command);

			fetch("/api/commandsave", { method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: command }) })
				.then(response => response.json())
				.then(data => {
					this.showToast("Command submitted", false);
				})
				.catch(error => {
					console.warn(error);
					this.showToast("Error triggering the command", true);
				})
		}
	}

	showToast = (message, isError) => {
		this.setState({
			toast: {
				text: message,
				isActive: true,
				type: isError ? "error" : "info"
			}
		});
		
		setTimeout(() => {
			this.setState({
				toast: {
					text: "",
					isActive: false,
					type: "info"
				}
			});
		}, 4000);
	}
	render() {
		return (
			<div className="appContainer">
				<div className="header">
					<h1>Command Center</h1>

					<h3 className="status">
						{ this.state.lastUpdate.getFullYear() + "/" + (this.state.lastUpdate.getMonth() + 1) + "/" + this.state.lastUpdate.getDate() }
					</h3>
				</div>

				<div className="controlsContainer">
				{
				this.state.controls.map((control, contolIndex) => (
					<ControlButton key={ contolIndex } control={ control } buttonAction={ this.buttonAction } />
				))
				}
				</div>
				
				<div className="panelContainer graphContainer">
					<div className="panelHeader">
						<div className="graphSelection active">Day</div>
						<div className="graphSelection">Week</div>
						<div className="graphSelection">Month</div>
					</div>

					<div className="graph">
						<svg viewBox="0 0 1000 400">

						</svg>
					</div>

				</div>
				
				<Toast message={ this.state.toast } />
			</div>
		);
	}
}

const ControlButton = (props) => {
	return (
		<div className={`panelContainer controlContainer ${ props.control.isActive ? 'active' : '' } ${ props.control.canControl ? 'controllable' : '' }`} onClick={ () => props.buttonAction(props.control) }>
			
			<div className="controlIcon">
				{ props.control.icon }
			</div>

			<div className="controlText">
				{ props.control.name }
			</div>

		</div>
	);
}

const Toast = (props) => {
	return (
		<div className={`toast ${ props.message.isActive ? "isActive" : "" } ${ props.message.type }`} >
			{ props.message.text }
		</div>
	);
};

ReactDOM.render(<App />, document.getElementById("root"));
