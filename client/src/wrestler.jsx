import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/wrestler.css";

class Wrestler extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			wrestlers: [],
			searchWrestler: "",
			searchTeam: "",
			history: [],
			toast: { message: "", type: "info" }
		};
	};

	componentDidMount() {
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
							this.setState({
								isLoading: false,
								wrestlers: data.wrestlers
									.sort((wrestlerA, wrestlerB) => wrestlerA.lastName > wrestlerB.lastName ? 1 : -1)
									.map(wrestler => ({
										...wrestler,
										lastMeet: wrestler.meets
											.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())[0],
										meets: wrestler.meets
											.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())
											.map(meet => ({
												...meet,
												startDate: new Date(meet.startDate),
												endDate: new Date(meet.endDate),
												matches: meet.matches
													.sort((matchA, matchB) => matchA.sort - matchB.sort)
											}))
								}))
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
							this.setState({
								isLoading: false,
								wrestlers: data.wrestlers
									.sort((wrestlerA, wrestlerB) => wrestlerA.lastName > wrestlerB.lastName ? 1 : -1)
									.map(wrestler => ({
										...wrestler,
										lastMeet: wrestler.meets
											.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())[0],
										meets: wrestler.meets
											.sort((meetA, meetB) => (new Date(meetB.startDate)).getTime() - (new Date(meetA.startDate)).getTime())
											.map(meet => ({
												...meet,
												startDate: new Date(meet.startDate),
												endDate: new Date(meet.endDate),
												matches: meet.matches
													.sort((matchA, matchB) => matchA.sort - matchB.sort)
											}))
								}))
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
			this.state.wrestlers.map((wrestler, wrestlerIndex) => 
			<div key={wrestlerIndex} className="listItem" onClick={ () => { this.setState({ wrestler: wrestler }) }}>
				<div className={ `listIcon ${ wrestler.lastMeet ? wrestler.lastMeet.location.state : "" }` }>{ wrestler.lastMeet ? wrestler.lastMeet.location.state : "-" }</div>

				<div className="listContent">
					<div className="listHeader">{wrestler.firstName} {wrestler.lastName}</div>
					<div className="listSubHeader">{ wrestler.team }</div>
				</div>

				<div className="listOther">
					{ wrestler.lastMeet ? wrestler.lastMeet.division + " / " + wrestler.lastMeet.weightClass : "" }
				</div>
			</div>
			)
			}
			</>
			:
			<>
			<div className="crumbs">
				<div className="crumb" onClick={ () => this.setState({ wrestler: null })}>X</div>
				{
				this.state.history.map((wrestler, wrestlerIndex) =>
				<div key={wrestlerIndex} className="crumb" onClick={ () => this.setState({ wrestler: null })}>{ wrestler.firstName } { wrestler.lastName }</div>
				)
				}
			</div>

			<div className="card">
				<div className="row">
					<div className={ `listIcon ${ this.state.wrestler.lastMeet ? this.state.wrestler.lastMeet.location.state : "" }` }>{ this.state.wrestler.lastMeet ? this.state.wrestler.lastMeet.location.state : "-" }</div>

					<div className="listContent">
						<div className="listHeader">{this.state.wrestler.firstName} {this.state.wrestler.lastName}</div>
						<div className="listSubHeader">{ this.state.wrestler.team }</div>
					</div>

					<div className="listOther">
						{ this.state.wrestler.lastMeet ? this.state.wrestler.lastMeet.division + " / " + this.state.wrestler.lastMeet.weightClass : "" }
					</div>
				</div>

				<div className="separator"></div>

				<div className="cardContent">	
				{
				this.state.wrestler.meets.map((meet, meetIndex) => 
				<div key={meetIndex} className="subCard">
					<div className="row spread">
						<div className={ `icon ${ this.state.wrestler.lastMeet ? this.state.wrestler.lastMeet.location.state : "" }` }>{ meet.location.state }</div>
						<div>{ meet.startDate ? ((meet.startDate.getMonth() + 1) + "").padStart(2, "0") + "/" + (meet.startDate.getDate() + "").padStart(2, "0") : "" }</div>
					</div>

					<div className="meet">{meet.name}</div>

					<div className="row spread">
						<div>Division: { meet.division }</div>
						<div>Weight: { meet.weightClass }</div>
					</div>
					
					<div className="separator"></div>

					{
					meet.matches.map((match, matchIndex) => 
						<div key={matchIndex} className="match">
							<div className="round">{ match.round}</div>
							<div className="matchContent row spread">
								<div className="column">
									<div className={ match.isWin ? "matchWin" : "" }>{ match.isWin ? "*" : "" }{ this.state.wrestler.firstName + " " + this.state.wrestler.lastName }</div>
									<div className={ !match.isWin ? "matchWin" : "" }>{ !match.isWin ? "*" : "" }{ match.vs.name }</div>
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
