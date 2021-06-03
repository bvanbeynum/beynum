import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./media/commandcenter.css";
import "./media/favicon.ico"

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			lastUpdate: new Date(),
			timespan: "day",
			sensorLogs: [],
			toast: { text: "", isActive: false, type: "info" },
			controls: {
				fan:  { name: "Fan", canControl: true, isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M14.5,17c0,1.65-1.35,3-3,3s-3-1.35-3-3h2c0,0.55,0.45,1,1,1s1-0.45,1-1s-0.45-1-1-1H2v-2h9.5 C13.15,14,14.5,15.35,14.5,17z M19,6.5C19,4.57,17.43,3,15.5,3S12,4.57,12,6.5h2C14,5.67,14.67,5,15.5,5S17,5.67,17,6.5 S16.33,8,15.5,8H2v2h13.5C17.43,10,19,8.43,19,6.5z M18.5,11H2v2h16.5c0.83,0,1.5,0.67,1.5,1.5S19.33,16,18.5,16v2 c1.93,0,3.5-1.57,3.5-3.5S20.43,11,18.5,11z"/></svg> },
				light: { name: "Light", isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg> },
				door: { name: "Door", isActive: false, icon: <svg viewBox="0 0 24 24"><path d="M14 6v15H3v-2h2V3h9v1h5v15h2v2h-4V6h-3zm-4 5v2h2v-2h-2z"/></svg> },
				motion: { name: "Motion", isActive: false, icon: <svg viewBox="0 0 24 24"><g><circle cx="12" cy="4" r="2"/><path d="M15.89,8.11C15.5,7.72,14.83,7,13.53,7c-0.21,0-1.42,0-2.54,0C8.24,6.99,6,4.75,6,2H4c0,3.16,2.11,5.84,5,6.71V22h2v-6h2 v6h2V10.05L18.95,14l1.41-1.41L15.89,8.11z"/></g></svg> }
			},
			graph: {
				size: { width: 1000, height: 400, innerWidth: 960, innerHeight: 370, padding: 20 },
				bottomAxis: [],
				leftAxis: [],
				rightAxis: [],
				tempPoints: [],
				humidityPoints: []
			}
		};
	}

	componentDidMount() {
		this.dataUpdate(); // Get the initial update

		this.intervalID = setInterval(this.dataUpdate, 5000); // Set an interval to get subsequent updates
	}

	componentWillUnmount() {
		clearInterval(this.intervalID);
	}

	dataUpdate = () => {

		fetch(`/api/commandcenterload?timespan=${ this.state.timespan }`)
			.then(response => response.json())
			.then(responseData => {

				const updateControls = this.state.controls,
					sensorLogs = responseData.sensorLogs
						.map(({ logTime, ...log }) => ({ logTime: new Date(logTime), ...log })) // Translate the date from ISO string to JS date
						.sort((logA, logB) => logA.logTime - logB.logTime); // Sort the logs ascending
				
				const lastLog = sensorLogs[sensorLogs.length - 1];

				// If the fan has been updated, check to make sure the status matches before resetting the dirty flag and active status
				if (this.state.controls.fan.isDirty && this.state.controls.fan.isActive == Boolean(lastLog.isFanOn)) {
					updateControls.fan.isDirty = false;
					updateControls.fan.isActive = Boolean(lastLog.isFanOn);
				}

				updateControls.light.isActive = Boolean(lastLog.isLight);
				updateControls.door.isActive = Boolean(lastLog.isDoorOpen);
				updateControls.motion.isActive = Boolean(lastLog.hasMotion);

				const graph = this.state.graph;

				graph.temp = {};
				graph.temp.min = Math.floor(Math.min(...sensorLogs.map(log => log.temp))) - 10;
				graph.temp.max = Math.ceil(Math.max(...sensorLogs.map(log => log.temp))) + 10;
				graph.temp.domainRange = graph.temp.max - graph.temp.min;
				graph.temp.graphSpace = graph.size.innerWidth / sensorLogs.length;
				
				graph.temp.values = sensorLogs.map((log, logIndex) => ({
					x: logIndex * graph.temp.graphSpace,
					y: ((graph.temp.max - log.temp) * graph.size.innerHeight) / graph.temp.domainRange,
					value: log.temp
				}));

				graph.tempPoints = graph.temp.values.map((point, pointIndex) => (pointIndex === 0 ? "M" : "L") + point.x + "," + point.y).join(" ");

				graph.humidity = {};
				graph.humidity.min = Math.floor(Math.min(...sensorLogs.map(log => log.humidity))) - 10;
				graph.humidity.max = Math.ceil(Math.max(...sensorLogs.map(log => log.humidity))) + 10;
				graph.humidity.domainRange = graph.humidity.max - graph.humidity.min;
				graph.humidity.graphSpace = graph.size.innerWidth / sensorLogs.length;
				
				graph.humidity.values = sensorLogs.map((log, logIndex) => ({
					x: logIndex * graph.temp.graphSpace,
					y: ((graph.humidity.max - log.humidity) * graph.size.innerHeight) / graph.humidity.domainRange,
					value: log.humidity
				}));

				graph.humidityPoints = graph.humidity.values.map((point, pointIndex) => (pointIndex === 0 ? "M" : "L") + point.x + "," + point.y).join(" ");

				graph.leftAxis = [...Array(5).keys()].map((index, indexIndex, array) => ({
					x: 0,
					y: graph.size.innerHeight - (index * Math.floor(graph.size.innerHeight / 4)),
					text: index === array.length - 1 ? graph.temp.max : graph.temp.min + (index * Math.floor((graph.temp.max - graph.temp.min) / 4)),
					alignment: index === 0 ? "baseline" : index === array.length - 1 ? "hanging" : "middle"
				}));

				graph.rightAxis = [...Array(5).keys()].map((index, indexIndex, array) => ({
					x: 0,
					y: graph.size.innerHeight - (index * Math.floor(graph.size.innerHeight / 4)),
					text: index === array.length - 1 ? graph.humidity.max : graph.humidity.min + (index * Math.floor((graph.humidity.max - graph.humidity.min) / 4)),
					alignment: index === 0 ? "baseline" : index === array.length - 1 ? "hanging" : "middle"
				}));

				graph.axis = {
					tickSpace: Math.floor(graph.size.innerWidth / 11)
				};

				graph.bottomAxis = sensorLogs
					.filter((log, logIndex, logArray) => logIndex % 10 === 0 || logIndex === logArray.length - 1)
					.map((log, logIndex, logArray) => ({
						x: ((logIndex * graph.axis.tickSpace) + Math.floor(graph.axis.tickSpace / 2)),
						y: 0,
						text: (log.logTime.getHours() % 12) + ":" + (log.logTime.getMinutes() + "").padStart(2, "0"),
						alignment: logIndex === 0 ? "start" : logIndex === logArray.length - 1 ? "end" : "middle"
					}));

				this.setState(({ controls }) => ({
					controls: updateControls,
					sensorLogs: sensorLogs,
					lastUpdate: new Date(),
					graph: graph
				}));

			});

	}
	
	buttonAction = (control) => {
		if (control.name === "Fan") {
			control.isActive = !control.isActive;
			control.isDirty = true;

			const command = { type: "fan", status: control.isActive };

			fetch("/api/commandsave", { method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: command }) })
				.then(response => response.json())
				.then(() => {
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
						{ 
						 	this.state.lastUpdate.getFullYear() + "/" + 
							(this.state.lastUpdate.getMonth() + 1) + "/" +
							this.state.lastUpdate.getDate() + " " +
							(this.state.lastUpdate.getHours() + "").padStart(2, "0") + ":" +
							(this.state.lastUpdate.getMinutes() + "").padStart(2, "0") + ":" +
							(this.state.lastUpdate.getSeconds() + "").padStart(2, "0")
						}
					</h3>
				</div>

				<div className="controlsContainer">
				{
				Object.keys(this.state.controls).map((control, contolIndex) => (
					<ControlButton key={ contolIndex } control={ this.state.controls[control] } buttonAction={ this.buttonAction } />
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
							
							<g trasform="translate(0)">
							{
							this.state.graph.leftAxis.map((tick, tickIndex) => (
								<text className="tempAxis" key={ tickIndex } x={ tick.x } y={ tick.y } alignmentBaseline={ tick.alignment }>{ tick.text }</text>
							))
							}
							</g>

							<g transform={ `translate(${ this.state.graph.size.padding + this.state.graph.size.innerWidth })` }>
							{
							this.state.graph.rightAxis.map((tick, tickIndex) => (
								<text className="humidityAxis" key={ tickIndex } x={ tick.x } y={ tick.y } alignmentBaseline={ tick.alignment }>{ tick.text }</text>
							))
							}
							</g>

							<g transform={ `translate(${ this.state.graph.size.padding }, ${ this.state.graph.size.innerHeight })` }>
							{
							this.state.graph.bottomAxis.map((tick, tickIndex) => (
								<text key={ tickIndex } x={ tick.x } y={ tick.y } alignmentBaseline="hanging" textAnchor={ tick.alignment }>{ tick.text }</text>
							))
							}
							</g>

							<g transform={ `translate(${ this.state.graph.size.padding })` }>
								<path className="temp" d={ this.state.graph.tempPoints } />
							</g>
							
							<g transform={ `translate(${ this.state.graph.size.padding })` }>
								<path className="humidity" d={ this.state.graph.humidityPoints } />
							</g>

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
