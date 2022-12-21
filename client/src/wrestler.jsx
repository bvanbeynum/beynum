import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/wrestler.css";

const winTypes = [
	{ code: "F", points: 6 },
	{ code: "DEC", points: 3 },
	{ code: "MD", points: 4 },
	{ code: "TF", points: 5 },
	{ code: "VSU", points: 5 },
	{ code: "VFA", points: 3 },
	{ code: "VSU1", points: 5 },
	{ code: "VPO1", points: 3 },
	{ code: "VPO", points: 3 }
];

class Wrestler extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			wrestlers: [],
			searchWrestler: "",
			searchTeam: "",
			filterDivision: "",
			filterWeight: "",
			history: [],
			toast: { message: "", type: "info" }
		};
	};

	searchWrestler = event => {
		this.setState({ searchWrestler: event.target.value, searchTeam: "", }, () => {
			if (this.state.searchWrestler && this.state.searchWrestler.length >=3 ) {
				this.setState(({ isLoading: true }), () => {
					fetch(`/wrestling/api/getwrestler?name=${ this.state.searchWrestler }`, { method: "post", headers: {"Content-Type": "application/json"} })
						.then(response => {
							if (response.ok) {
								return response.json();
							}
							else {
								throw Error(response.statusText);
							}
						})
						.then(data => {
							const wrestlers = this.loadWrestlers(data.wrestlers).slice(0,200);

							this.setState({
								isLoading: false,
								wrestlers: wrestlers,
								divisions: [... new Set(wrestlers.map(wrestler => wrestler.division))].sort(),
								weightClasses: [... new Set(wrestlers.map(wrestler => wrestler.weightClass))].sort()
							});
						})
						.catch(error => {
							console.warn(error);
							this.setState({ toast: { text: "Error loading data", type: "error" } });
						});
				});
			}
		});
	};

	searchTeam = event => {
		this.setState({ searchTeam: event.target.value, searchWrestler: "", }, () => {
			if (this.state.searchTeam && this.state.searchTeam.length >=3 ) {
				this.setState(({ isLoading: true }), () => {
					fetch(`/wrestling/api/getwrestler?team=${ this.state.searchTeam }`, { method: "post", headers: {"Content-Type": "application/json"} })
						.then(response => {
							if (response.ok) {
								return response.json();
							}
							else {
								throw Error(response.statusText);
							}
						})
						.then(data => {
							const wrestlers = this.loadWrestlers(data.wrestlers);

							this.setState({
								isLoading: false,
								wrestlers: wrestlers
									.sort((wrestlerA, wrestlerB) => wrestlerA.isActive && !wrestlerB.isActive ? -1
										: !wrestlerA.isActive && wrestlerB.isActive ? 1
										: wrestlerA.lastMeet.division < wrestlerB.lastMeet.division ? -1
										: wrestlerA.lastMeet.division > wrestlerB.lastMeet.division ? 1
										: wrestlerA.lastMeet.weightClass < wrestlerB.lastMeet.weightClass ? -1 
										: 1
									).slice(0, 200),
								divisions: [... new Set(wrestlers.map(wrestler => wrestler.division))].sort(),
								weightClasses: [... new Set(wrestlers.map(wrestler => wrestler.weightClass))].sort()
							});
						})
						.catch(error => {
							console.warn(error);
							this.setState({ toast: { text: "Error loading data", type: "error" } });
						});
				});
			}
		});
	};

	loadWrestlers = wrestlers => {
		const seasonStart = (new Date()).getMonth() >= 8 ? new Date((new Date()).getFullYear(), 8, 1) : new Date((new Date()).getFullYear() - 1, 8, 1)

		return wrestlers
			.map(wrestler => ({
				...wrestler,
				meetCount: wrestler.meets.length,
				seasonAverageMeetPoints: wrestler.meets.some(meet => new Date(meet.startDate) > (Date.now() - (1000 * 60 * 60 * 24 * 120))) ?
					wrestler.meets
						.filter(meet => new Date(meet.startDate) > (Date.now() - (1000 * 60 * 60 * 24 * 120)))
						.reduce((meetTotal, meet) => meetTotal + 
							meet.matches
								.filter(match => winTypes.some(winType => winType.code == match.winType))
								.reduce((matchTotal,match) => matchTotal + (winTypes.filter(winType => winType.code == match.winType).map(winType => winType.points) * (match.isWin ? 1 : -1)), 0)
						, 0) / wrestler.meets.filter(meet => new Date(meet.startDate) > (Date.now() - (1000 * 60 * 60 * 24 * 120))).length
					: null,
				careerAverageMeetPoints: wrestler.meets && wrestler.meets.length > 0 ?
					wrestler.meets
						.reduce((meetTotal, meet) => meetTotal + 
							meet.matches
								.filter(match => winTypes.some(winType => winType.code == match.winType))
								.reduce((matchTotal,match) => matchTotal + (winTypes.filter(winType => winType.code == match.winType).map(winType => winType.points) * (match.isWin ? 1 : -1)), 0)
						, 0) / wrestler.meets.length
					: null,
				matches: wrestler.meets
					.filter(meet => (new Date(meet.startDate)).getTime() > seasonStart.getTime())
					.flatMap(meet => meet.matches.filter(match => match.winType)).length,
				wins: wrestler.meets
					.filter(meet => (new Date(meet.startDate)).getTime() > seasonStart.getTime())
					.flatMap(meet => meet.matches.filter(match => match.isWin && match.winType)).length,
				losses: wrestler.meets
					.filter(meet => (new Date(meet.startDate)).getTime() > seasonStart.getTime())
					.flatMap(meet => meet.matches.filter(match => !match.isWin && match.winType)).length,
				isActive: wrestler.meets.some(meet => new Date(meet.startDate) > (Date.now() - (1000 * 60 * 60 * 24 * 120))),
				lastMeet: wrestler.meets
					.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())
					.map(meet => ({
						...meet,
						startDate: new Date(meet.startDate),
						endDate: new Date(meet.endDate)
					}))[0],
				meets: wrestler.meets
					.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())
					.map(meet => ({
						...meet,
						matchesCount: meet.matches.filter(match => match.winType).length,
						wins: meet.matches.filter(match => match.isWin && match.winType).length,
						losses: meet.matches.filter(match => !match.isWin && match.winType).length,
						points: meet.matches
							.filter(match => winTypes.some(winType => winType.code == match.winType))
							.reduce((matchTotal,match) => matchTotal + (winTypes.filter(winType => winType.code == match.winType).map(winType => winType.points) * (match.isWin ? 1 : -1)), 0),
						startDate: new Date(meet.startDate),
						endDate: new Date(meet.endDate),
						matches: meet.matches
							.sort((matchA, matchB) => matchA.sort - matchB.sort)
					}))
			}))
			.sort((wrestlerA, wrestlerB) => wrestlerA.isActive && !wrestlerB.isActive ? -1
				: !wrestlerA.isActive && wrestlerB.isActive ? 1
				: wrestlerA.lastName < wrestlerB.lastName ? -1
				: 1);
	};

	selectWrestler = wrestlerDBId => {
		this.setState(({ isLoading: true }), () => {
			fetch(`/wrestling/api/getwrestler?dbid=${ wrestlerDBId }`, { method: "post", headers: {"Content-Type": "application/json"} })
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					const wrestlers = this.loadWrestlers(data.wrestlers);

					this.setState(({ history, wrestler }) => ({
						isLoading: false,
						history: history.concat(wrestlers[0]),
						wrestler: wrestlers[0]
					}));
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		});	
	}
	
	render() { return (
		<div className="pageContainer">
		
		<div className="content">
			{
			!this.state.wrestler ?
			<>
			<div className="search">
				<input type="text" value={ this.state.searchWrestler } placeholder="-- Wrestler --" onChange={ this.searchWrestler } />
				<input type="text" value={ this.state.searchTeam } placeholder="-- Team --" onChange={ this.searchTeam } />
			</div>
			
			{
			this.state.divisions && this.state.weightClasses ?
			<div className="search">
				<select value={ this.state.filterDivision } onChange={ event => this.setState({ filterDivision: event.target.value }) }>
					<option value="">- Division -</option>
					{
					this.state.divisions.map((division, divisionIndex) =>
					<option key={divisionIndex}>{ division }</option>
					)
					}
				</select>
				<select value={ this.state.filterWeight } onChange={ event => this.setState({ filterWeight: event.target.value }) }>
					<option value="">- Weigh Class -</option>
					{
					this.state.weightClasses.map((weight, weightIndex) =>
					<option key={weightIndex}>{ weight }</option>
					)
					}
				</select>
			</div>
			: ""
			}

			{
			this.state.wrestlers
			.filter(wrestler => (!this.state.filterDivision || this.state.filterDivision == wrestler.division) && (!this.state.filterWeight || this.state.filterWeight == wrestler.weightClass))
			.map((wrestler, wrestlerIndex) => 
			<div key={wrestlerIndex} className="listItem" onClick={ () => { this.setState({ history: [wrestler], wrestler: wrestler }) }}>
				<div className={ `listIcon ${ wrestler.state }` }>{ wrestler.state }</div>

				<div className="listContent">
					<div className="listHeader">{wrestler.firstName} {wrestler.lastName}</div>
					<div className="listSubHeader">{ wrestler.team }</div>
					<div className="listSubHeader">{ wrestler.division + " • " + wrestler.weightClass }</div>
				</div>

				<div className="listCrumbs">
					<div className={`crumb ${ !wrestler.isActive ? "inactive" : "" }`}>{ wrestler.isActive ? "Active" : "Inactive" }</div>
				</div>
			</div>
			)
			}
			</>
			:
			<>
			<div className="crumbs">
				<div className="crumb selectable" onClick={ () => this.setState({ wrestler: null })}>X</div>
				{
				this.state.history.map((wrestler, wrestlerIndex) =>
				<div key={wrestlerIndex} className="crumb" onClick={ () => { if (this.state.wrestler && this.state.wrestler.id !== wrestler.id) this.setState({ wrestler: wrestler }) }}>
					{ wrestler.firstName } { wrestler.lastName }
				</div>
				)
				}
			</div>

			<div className="card">
				<div className="row">
					<div className={ `listIcon ${ this.state.wrestler.state }` }>{ this.state.wrestler.state }</div>

					<div className="listContent">
						<div className="listHeader">{this.state.wrestler.firstName} {this.state.wrestler.lastName}</div>
						<div className="listSubHeader">{ this.state.wrestler.team }</div>
						
						{
						this.state.wrestler.ranking ?
						<div className="listSubHeader">SCmat Ranking: { this.state.wrestler.ranking }</div>
						: ""
						}

						{
						this.state.wrestler.matches ? 
						<div className="listSubHeader">
								{
								this.state.wrestler.wins + " Wins, " +
								this.state.wrestler.losses + " Losses (" +
								(this.state.wrestler.wins / this.state.wrestler.matches).toFixed(3) + ")"
								}
						</div>
						: "" 
						}

						{
						this.state.wrestler.seasonAverageMeetPoints !== null ? 
						<div className="listSubHeader">Season avg points: { this.state.wrestler.seasonAverageMeetPoints.toFixed(3) }</div>
						: "" 
						}
						
						{
						this.state.wrestler.careerAverageMeetPoints !== null ? 
						<div className="listSubHeader">Career avg points: { this.state.wrestler.careerAverageMeetPoints.toFixed(3) }</div>
						: "" 
						}
					</div>

					<div className="listOther">
						{ this.state.wrestler.division + " • " + this.state.wrestler.weightClass }
					</div>
				</div>

				<div className="separator"></div>

				<div className="cardContent">	
				{
				this.state.wrestler.meets.map((meet, meetIndex) => 
				<div key={meetIndex} className="subCard">
					<div className="row spread">
						<div className={ `icon ${ meet.location ? meet.location.state : "" }` }>{ meet.location.state }</div>
						<div>{ meet.startDate ? ((meet.startDate.getMonth() + 1) + "").padStart(2, "0") + "/" + (meet.startDate.getDate() + "").padStart(2, "0") + "/" + (meet.startDate.getFullYear() - 2000) : "" }</div>
					</div>

					<div className="meet">{meet.name}</div>

					<div className="row spread">
						<div>Division: { meet.division }</div>
						<div>Weight: { meet.weightClass }</div>
					</div>

					<div className="separator"></div>

					<div className="row">
					{
					meet.wins + " Wins, " +
					meet.losses + " Losses (" +
					(meet.wins / meet.matchesCount).toFixed(3) + ")"
					}
					</div>
					
					<div className="row">
						<div>Points: { meet.points }</div>
					</div>

					<div className="separator"></div>

					{
					meet.matches.map((match, matchIndex) => 
						<div key={matchIndex} className="match">
							<div className="round">{ match.round}</div>
							<div className="matchContent row spread">
								<div className="column">
									<div className={ `matchWrestler ${ match.isWin ? "matchWin" : "" }` }>
										{ match.isWin ? "*" : "" }{ this.state.wrestler.firstName + " " + this.state.wrestler.lastName + " (" + this.state.wrestler.team + ")" }
									</div>
									<div className={ `matchWrestler ${ !match.isWin ? "matchWin" : "" }` } onClick={ () => { if (match.vs && match.vs.dbId) { this.selectWrestler(match.vs.dbId) } }}>
										{ !match.isWin ? "*" : "" }{ match.vs.name + " (" + match.vs.team + ")" }
									</div>
								</div>

								<div>{ match.winType }</div>
							</div>
						</div>
					)
					}
				</div>
				)
				}
				</div>
			</div>
			</>
			}

		</div>

		{
		this.state.isLoading ?
		<div className="loading">
			<img alt="Loading" src="/media/wrestlingloading.gif" />
		</div>
		: ""
		}

		<Toast message={ this.state.toast } />
	</div>
	); }
}

ReactDOM.render(<Wrestler />, document.getElementById("root"));
