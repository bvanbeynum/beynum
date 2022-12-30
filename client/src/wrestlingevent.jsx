import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/wrestlingevent.css";

class WrestlingEvent extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			eventsSelection: "Current",
			selectedDivision: null,
			selectedWeight: null,
			selectedPool: null,
			nameSearch: "",
			locationSearch: "",
			updateTeamSearch: "",
			updateTypeFilter: "",
			refreshInterval: null,
			timeInterval: null,
			activeSearch: true,
			toast: { message: "", type: "info" }
		};
	};

	crumbSeparator = " > ";

	componentDidMount() {
		fetch("/wrestling/api/eventload")
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
					updates: [],
					events: data.events
						.map(event => ({...event, startDate: new Date(event.startDate), endDate: new Date(event.endDate) }))
						.sort((eventA, eventB) => eventA.startDate - eventB.startDate)
				});
			})
			.catch(error => {
				console.warn(error);
				this.setState({ toast: { text: "Error loading data", type: "error" } });
			});
	};

	componentWillUnmount() {
		if (this.state.refreshInterval) {
			clearInterval(this.state.refreshInterval);
		}
		if (this.state.timeInterval) {
			clearInterval(this.state.timeInterval);
		}
	}
	
	selectEvents = event => {
		this.setState({ isLoading: true, eventsSelection: event.target.value }, () => {
			fetch(`/wrestling/api/eventload?events=${ this.state.eventsSelection.toLowerCase() }`)
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
						events: data.events
							.map(event => ({...event, startDate: new Date(event.startDate), endDate: new Date(event.endDate) }))
							.sort((eventA, eventB) => this.state.eventsSelection.toLowerCase() === "past" ? eventB.startDate - eventA.startDate : eventA.startDate - eventB.startDate)
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		});
	};

	selectEvent = event => {
		this.setState({ isLoading: true, event: event }, () => {
			fetch(`/wrestling/api/eventdetails?eventid=${ event.flowId }`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ event: event }) })
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					this.loadData(data, () => {
						let timeInterval = null,
							refreshInterval = null;
							
						if ((new Date()) < this.state.event.endDate) {
							let interval = 3600000; // one hour default refresh

							if ((new Date()) > (this.state.event.startDate.getTime() - 86400000)) {
								// Event is current
								interval = 60000; // one min
							}

							timeInterval = setInterval(() => this.setState(({ timeDisplay: Math.floor(((new Date()) - this.state.event.lastRefresh) / 1000 / 60) + "m " + Math.floor(((new Date()) - this.state.event.lastRefresh) / 1000 % 60) + "s" })), 1000);
							refreshInterval = setInterval(this.refreshData, interval);
						}

						this.setState({
							isLoading: false,
							timeDisplay: timeInterval ? Math.floor(((new Date()) - this.state.event.lastRefresh) / 1000 / 60) + "m " + Math.floor(((new Date()) - this.state.event.lastRefresh) / 1000 % 60) + "s"
								: "N/A",
							timeInterval: timeInterval,
							refreshInterval: refreshInterval,
						})
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		});
	};

	refreshData = () => {
		this.setState(({ isRefresh: true }), () => {
			fetch(`/wrestling/api/eventdetails?eventid=${ this.state.event.flowId }`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ event: this.state.event }) })
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					this.setState(({ event }) => ({ prevMatches: [ ...event.divisions.flatMap(division => division.weightClasses.flatMap(weight => weight.pools.flatMap(pool => pool.matches))) ] }), () => {
						this.loadData(data, () => {

							const updates = this.state.updates,
								batchUpdates = [],
								updateTime = new Date();

							this.state.event.divisions
								.flatMap(division => division.weightClasses.flatMap(weight => weight.pools.flatMap(pool => pool.matches.map(match => ({...match, division: division.name, weightClass: weight.name })) )))
								.forEach(match => {
									const prevMatch = this.state.prevMatches.find(prevMatch => match.flowId === prevMatch.flowId);

									if (!prevMatch) {
										batchUpdates.push({ type: "New Match", division: match.division, weightClass: match.weightClass, match: match, time: new Date() });
									}
									else {
										if (!prevMatch.wrestler1 && match.wrestler1) {
											batchUpdates.push({ type: "Wrestler Assigned", division: match.division, weightClass: match.weightClass, wrestler: match.wrestler1, prev: prevMatch, match: match, time: updateTime });
										}
										if (!prevMatch.wrestler2 && match.wrestler2) {
											batchUpdates.push({ type: "Wrestler Assigned", division: match.division, weightClass: match.weightClass, wrestler: match.wrestler2, prev: prevMatch, match: match, time: updateTime });
										}
										if (!prevMatch.mat && match.mat) {
											batchUpdates.push({ type: "Mat Assigned", division: match.division, weightClass: match.weightClass, wrestler1: match.wrestler1, wrestler2: match.wrestler2, mat: match.mat, prev: prevMatch, match: match, time: updateTime });
										}
										if (prevMatch.wrestler2 && match.wrestler2 && !prevMatch.winType && match.winType) {
											batchUpdates.push({
												type: "Match Completed",
												division: match.division, 
												weightClass: match.weightClass, 
												winner: match.wrestler1.isWinner ? match.wrestler1 : match.wrestler2,
												loser: match.wrestler1.isWinner ? match.wrestler2 : match.wrestler1,
												winType: match.winType,
												prev: prevMatch,
												match: match,
												time: updateTime
											});
										}
									}

								});
							
							if (batchUpdates.length > 0) {
								updates.push({
									time: updateTime,
									batch: batchUpdates
								});
								
								this.setState({
									updates: updates,
									isRefresh: false
								});
							}
						});
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		});
	};

	loadData = (data, complete) => {
		this.setState(({
			isRefresh: false,
			event: {
				...data.event,
				startDate: new Date(data.event.startDate),
				endDate: new Date(data.event.endDate),
				lastRefresh: new Date(data.event.lastRefresh),
				divisions: data.event.divisions
					.sort((divisionA, divisionB) => divisionA.sort - divisionB.sort)
					.map(division => ({
						...division,
						weightClasses: division.weightClasses
							.sort((weightA, weightB) => weightA.sort - weightB.sort)
							.map(weight => ({
								...weight,
								pools: weight.pools
									.sort((poolA, poolB) => poolA.sort - poolB.sort)
									.map(pool => ({
										...pool,
										rounds: [...new Set(pool.matches.sort((matchA, matchB) => matchA.sort - matchB.sort).map(match => match.round))].map(round => ({
											name: round,
											matches: pool.matches
												.filter(match => match.round === round)
												.sort((matchA, matchB) => matchA.sort - matchB.sort)
												.map(match => ({
													...match,
													status: match.winType !== null ? "complete"
														: pool.matches
															.filter(all => all.winType === null)
															.sort((matchA, matchB) => matchA.sort - matchB.sort)
															.map(all => all.flowId)[0] === match.flowId ? "next"
														: "upcoming"
												}))
										}))
									}))
							}))
					}))
			},
			mats: data.mats
				.sort((matA, matB) => matA.name > matB.name)
				.map(mat => ({
					...mat,
					total: mat.matches.filter(match => match.wrestler1 && match.wrestler2).length,
					completed: mat.matches.filter(match => match.wrestler1 && match.wrestler2 && match.winType).length,
					remaining: mat.matches.filter(match => !match.winType).length,
					current: mat.matches.filter(match => !match.winType).sort((matchA, matchB) => matchA.sort - matchB.sort).slice(0,1)[0],
					onDeck: mat.matches.filter(match => !match.winType).sort((matchA, matchB) => matchA.sort - matchB.sort).slice(1,2)[0],
					hole: mat.matches.filter(match => !match.winType).sort((matchA, matchB) => matchA.sort - matchB.sort).slice(2,3)[0]
				})),
			teams: data.teams
		}), () => {
			complete();
		});
	};

	render() { return (
		<div className="pageContainer">
			
		{
		this.state.isLoading ?
			<div className="loading">
				<img alt="Loading" src="/media/wrestlingloading.gif" />
			</div>
		: this.state.event ?
			<div className="content">
				<div className="header">
					<h2>{ this.state.event.name }</h2>
				</div>

				{
				// Mat view
				this.state.view === "mat" && this.state.mats.length === 0 ?
				<h2>
					No mats assigned
				</h2>
				: this.state.view === "mat" && this.state.mats.length > 0 ?
				this.state.mats.map((mat, matIndex) => 

				<div key={matIndex} className="listItem row selectable">
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemHeader">{mat.name}</div>
						<div className="listItemSubHeader">{ `${ mat.total - mat.completed } of ${ mat.total } remaining` }</div>

						<div className="listItemSubHeader">
							Current: 
							{
							mat.current ?
								`${ mat.current.matchNumber } ${ mat.current.wrestler1.firstName } ${ mat.current.wrestler1.lastName } vs ${ mat.current.wrestler2.firstName } ${ mat.current.wrestler2.lastName } • ${ mat.current.division } / ${ mat.current.weightClass }`
							: "N/A"
							}
						</div>
						
						<div className="listItemSubHeader">
							On Deck: 
							{
							mat.onDeck ?
								`${ mat.onDeck.matchNumber } ${ mat.onDeck.wrestler1.firstName } ${ mat.onDeck.wrestler1.lastName } vs ${ mat.onDeck.wrestler2.firstName } ${ mat.onDeck.wrestler2.lastName } • ${ mat.onDeck.division } / ${ mat.onDeck.weightClass }`
							: "N/A"
							}
						</div>
						
						<div className="listItemSubHeader">
							In The Hole: 
							{
							mat.hole ?
								`${ mat.hole.matchNumber } ${ mat.hole.wrestler1.firstName } ${ mat.hole.wrestler1.lastName } vs ${ mat.hole.wrestler2.firstName } ${ mat.hole.wrestler2.lastName } • ${ mat.hole.division } / ${ mat.hole.weightClass }`
							: "N/A"
							}
						</div>
					</div>
				</div>

				)

				// Team view
				: this.state.view === "team"  && this.state.teams.length === 0 ?
				<h2>
					No Teams available
				</h2>
				: this.state.view === "team" && this.state.teams.length > 0 ?
				this.state.teams.map((team, teamIndex) => 

				<div key={teamIndex} className="listItem row selectable">
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemHeader">{team.name}</div>

						<div className="listItemSubHeader">
							{
							team.wrestlers.map((wrestler, wrestlerIndex) => 
							<div key={wrestlerIndex}>
								{ `${wrestler.firstName} ${wrestler.lastName}, record: ${wrestler.wins}:${wrestler.losses}`}
							</div>
							)
							}
						</div>
					</div>
				</div>

				)
				: this.state.view === "updates" && this.state.updates.length === 0 ?
				<h2>
					No Updates
				</h2>
				: this.state.view === "updates" ?
				<>
				<div className="actions">
					<input type="text" value={ this.state.updateTeamSearch } placeholder="-- Team Search --" onChange={ event => this.setState({ updateTeamSearch: event.target.value }) } />
					<select value={ this.state.updateTypeFilter } onChange={ event => { this.setState({ updateTypeFilter: event.target.value }) }}>
						<option value="">Update Type</option>
						<option value="Match Completed">Match Completed</option>
						<option value="Wrestler Assigned">Wrestler Assigned</option>
						<option value="Mat Assigned">Mat Assigned</option>
					</select>
				</div>
				{
				this.state.updates
				.filter(batch => batch.batch.some(update => 
					(!this.state.updateTypeFilter || update.type === this.state.updateTypeFilter) &&
					(!this.state.updateTeamSearch ||
						(update.type === "Match Completed" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.winner.team) || (new RegExp(this.state.updateTeamSearch, "i")).test(update.loser.team))) ||
						(update.type === "Wrestler Assigned" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler.team))) ||
						(update.type === "Mat Assigned" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler1.team) || (new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler2.team)))
					)
					))
				.sort((batchA, batchB) => batchB.time - batchA.time)
				.map((batch, batchIndex) => 
				<div key={batchIndex}>
					<div className="roundLine"></div>
					<div className="round"><span>{ ((batch.time.getHours() % 12 || 12) + "").padStart("0", 2) + ":" + (batch.time.getMinutes() + "").padStart("0", 2) + " " + (batch.time.getHours() < 12 ? "am": "pm" ) }</span></div>

					{
					batch.batch
					.filter(update => 
						(!this.state.updateTypeFilter || update.type === this.state.updateTypeFilter) &&
						(!this.state.updateTeamSearch ||
							(update.type === "Match Completed" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.winner.team) || (new RegExp(this.state.updateTeamSearch, "i")).test(update.loser.team))) ||
							(update.type === "Wrestler Assigned" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler.team))) ||
							(update.type === "Mat Assigned" && ((new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler1.team) || (new RegExp(this.state.updateTeamSearch, "i")).test(update.wrestler2.team)))
						)
					)
					.map((update, updateIndex) => 
					<div key={updateIndex} className="listItem row selectable">
						<div className="sidebar"></div>
	
						<div className="listItemContent column">
							<div className="listItemHeader">{ update.type }</div>
							
							<div className="listItemSubHeader">
								{ update.division + " • " + update.weightClass + " • " + update.match.round }
							</div>

							<div className="listItemSubHeader">
								{
								update.type === "Match Completed" ? 
									`${ update.winner.firstName } ${ update.winner.lastName } (${ update.winner.team}) beat ${ update.loser.firstName } ${ update.loser.lastName } (${ update.loser.team}) by ${ update.winType}`
								: update.type === "Wrestler Assigned" ? 
									`${ update.wrestler.firstName } ${ update.wrestler.lastName } (${ update.wrestler.team}) assigned to match ${ update.match.matchNumber } (${ update.match.round })`
								: update.type === "Mat Assigned" ? 
									`${ update.wrestler1.firstName } ${ update.wrestler1.lastName } (${ update.wrestler1.team}) and ${ update.wrestler2.firstName } ${ update.wrestler2.lastName } (${ update.wrestler2.team}) assigned to mat ${ update.mat.name }`
								: ""
								}
							</div>
						</div>
					</div>
					)
					}
				</div>
				)
				}
				</>
				:
				// Match view
				<>
				<div className="crumbs">
					{
					this.state.selectedDivision !== null ? 
						<span onClick={ () => { this.setState({ selectedDivision: null, selectedWeight: null, selectedPool: null}) }}>{this.state.event.divisions[this.state.selectedDivision].name}</span>
					: ""
					}

					{
					this.state.selectedDivision !== null && this.state.selectedWeight !== null ?
						<>{" > "}<span onClick={ () => { this.setState({ selectedWeight: null, selectedPool: null}) }}>{this.state.event.divisions[this.state.selectedDivision].weightClasses[this.state.selectedWeight].name}</span></>
					: ""
					}

					{
					this.state.selectedDivision !== null && this.state.selectedWeight !== null && this.state.selectedPool !== null && this.state.event.divisions[this.state.selectedDivision].weightClasses[this.state.selectedWeight].pools.length > 1 ?
						<>{" > "}<span onClick={ () => { this.setState({ selectedPool: null}) }}>{this.state.event.divisions[this.state.selectedDivision].weightClasses[this.state.selectedWeight].pools[this.state.selectedPool].name}</span></>
					: ""
					}
				</div>

				{
				this.state.selectedDivision === null ?
				this.state.event.divisions.map((division, divisionIndex) => 

				<div key={divisionIndex} className="listItem row selectable" onClick={ () => { this.setState(({ selectedDivision: divisionIndex })) }}>
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemHeader">{division.name}</div>
						<div className="listItemSubHeader">{division.weightClasses.length} weight classes</div>
					</div>
				</div>

				)

				// Weight class list
				: this.state.selectedDivision !== null && this.state.selectedWeight === null ?
				this.state.event.divisions[this.state.selectedDivision].weightClasses.map((weight, weightIndex) => 

				<div key={weightIndex} className="listItem row selectable" onClick={ () => { this.setState(({ selectedWeight: weightIndex, selectedPool: weight.pools.length == 1 ? 0 : null })) }}>
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemHeader">{weight.name}</div>
						<div className="listItemSubHeader">{ weight.pools.length == 1 ? weight.pools[0].matches.length + " matches" : weight.pools.length + " pools"}</div>
					</div>
				</div>

				)

				// Pool list (if more than one pool)
				: this.state.selectedDivision !== null && this.state.selectedWeight !== null && this.state.selectedPool === null ?
				this.state.event.divisions[this.state.selectedDivision].weightClasses[this.state.selectedWeight].pools.map((pool, poolIndex) => 

				<div key={poolIndex} className="listItem row selectable" onClick={ () => { this.setState(({ selectedPool: poolIndex })) }}>
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemHeader">{pool.name}</div>
						<div className="listItemSubHeader">{ pool.matches.length + " matches" }</div>
					</div>
				</div>

				)

				// All matches
				// : this.state.selectedDivision !== null && this.state.selectedWeight !== null && this.state.selectedPool !== null
				:
				this.state.event.divisions[this.state.selectedDivision].weightClasses[this.state.selectedWeight].pools[this.state.selectedPool].rounds.map((round, roundIndex) => 

				<div key={roundIndex}>
					<div className="roundLine"></div>
					<div className="round"><span>{ round.name }</span></div>

					{
					round.matches.map((match, matchIndex) =>
					<div key={matchIndex} className={`listItem row ${ match.status }`}>
						<div className="sidebar"></div>
						
						<div className="listItemContent column">
							{
							match.mat && match.matchNumber ?
							<div className="listItemSubHeader">{ match.mat ? match.mat.name : "Unassigned" } / { match.matchNumber }</div>
							: ""
							}

							{
							match.wrestler1 || match.wrestler2 ?
							<div className="matchWrestlers row">
								<div className={`wrestlerContainer column ${ match.wrestler1 && match.wrestler1.isWinner === true ? "winner" : ""}`}>
									{
									match.wrestler1 ?
									<>
									<div>{ match.wrestler1.firstName } { match.wrestler1.lastName }</div>
									<div className="listItemSubHeader">{ match.wrestler1.team }</div>
									</>
									: ""
									}
								</div>

								<div>{ match.winType ? match.winType : "vs" }</div>
								
								<div className={`wrestlerContainer column ${ match.wrestler2 && match.wrestler2.isWinner === true ? "winner" : ""}`}>
									{
									match.wrestler2 ?
									<>
									<div>{ match.wrestler2.firstName } { match.wrestler2.lastName }</div>
									<div className="listItemSubHeader">{ match.wrestler2.team }</div>
									</>
									: ""
									}
								</div>

							</div>
							: 
							<div className="unscheduled">TBD</div>
							}
						</div>

					</div>
					)
					}
				</div>
				)
				}
				</>
				// End view selector
				}
				<div className="bottomNav">
					<div className="navButton selectable" onClick={ () => this.setState(({ view: null })) }>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
							<path d="M2 36.667.042 34.708 6.167 28.5l-1.834-5.125Q4 22.5 4.167 21.625q.166-.875.875-1.583l5.625-5.667q.416-.417.979-.667.562-.25 1.146-.25.625 0 1.166.25.542.25 1 .667l3.459 3.292q1.541 1.458 2.958 2.021 1.417.562 3.292.562v2.792q-2.25 0-4.292-.73-2.042-.729-3.708-2.395L15.25 18.5l-4.458 4.458 3.791 3.75v9.959h-2.791v-8.709l-2.834-2.666v4.375Zm23.292 0V25.208l3.666-3.458-1.25-6.917q-1.333 1.75-2.52 2.646-1.188.896-2.521 1.313-.875-.25-1.771-.73-.896-.479-1.479-1.104 1.875-.333 3.479-1.291 1.604-.959 2.854-3.042l1.708-2.75q.709-1.125 1.813-1.479 1.104-.354 2.271.146l8.416 3.666v7.375h-2.791v-5.541l-3.709-1.625 4.709 24.25H35.25l-3.208-13.042-3.959 3.917v9.125Zm-6.459-22.625q-1.291 0-2.229-.917-.937-.917-.937-2.208 0-1.292.937-2.209.938-.916 2.229-.916 1.292 0 2.209.916.916.917.916 2.209 0 1.291-.916 2.208-.917.917-2.209.917Zm8.584-6.917q-1.292 0-2.209-.937-.916-.938-.916-2.23 0-1.291.916-2.208.917-.917 2.209-.917 1.291 0 2.229.917.937.917.937 2.208 0 1.292-.937 2.23-.938.937-2.229.937Z"/>
						</svg>
					</div>

					<div className="navButton selectable" onClick={ () => this.setState(({ view: "mat" })) }>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
							<path d="M6.125 33.333q-1.167 0-1.979-.812-.813-.813-.813-1.979V9.458q0-1.166.813-1.979.812-.812 1.979-.812h27.75q1.167 0 1.979.812.813.813.813 1.979v21.084q0 1.166-.813 1.979-.812.812-1.979.812Zm0-2.791h4.167V9.458H6.125v21.084Zm6.917 0h13.916V9.458H13.042Zm16.666 0h4.167V9.458h-4.167ZM13.042 9.458v21.084Z"/>
						</svg>
					</div>

					<div className="navButton selectable" onClick={ () => this.setState(({ view: "team" })) }>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
							<path d="M0 30v-2.333q0-1.709 1.792-2.75 1.791-1.042 4.625-1.042.5 0 .979.021t.937.104q-.416.75-.625 1.562-.208.813-.208 1.73V30Zm10 0v-2.708q0-2.709 2.771-4.375Q15.542 21.25 20 21.25q4.5 0 7.25 1.667Q30 24.583 30 27.292V30Zm22.5 0v-2.708q0-.917-.188-1.73-.187-.812-.604-1.562.459-.083.938-.104.479-.021.979-.021 2.875 0 4.625 1.042Q40 25.958 40 27.667V30ZM20 24.042q-3 0-5.021.875t-2.146 2.166v.125h14.334v-.166q-.125-1.25-2.125-2.125T20 24.042ZM6.375 22.5q-1.25 0-2.146-.896-.896-.896-.896-2.146 0-1.291.896-2.187.896-.896 2.146-.896 1.292 0 2.187.896.896.896.896 2.187 0 1.25-.896 2.146-.895.896-2.187.896Zm27.208 0q-1.25 0-2.146-.896-.895-.896-.895-2.146 0-1.291.895-2.187.896-.896 2.188-.896 1.25 0 2.146.896.896.896.896 2.187 0 1.25-.896 2.146-.896.896-2.188.896ZM20 20q-2.083 0-3.542-1.458Q15 17.083 15 15q0-2.125 1.458-3.562Q17.917 10 20 10q2.125 0 3.562 1.438Q25 12.875 25 15q0 2.083-1.438 3.542Q22.125 20 20 20Zm0-7.208q-.917 0-1.562.625-.646.625-.646 1.583 0 .917.625 1.562.625.646 1.583.646t1.583-.625q.625-.625.625-1.583t-.625-1.583q-.625-.625-1.583-.625Zm0 14.416ZM20 15Z"/>
						</svg>
					</div>

					<div className="navButton selectable" onClick={ () => this.setState(({ view: "updates" })) }>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
							<path d="M5.542 11.958q-.917 0-1.563-.645-.646-.646-.646-1.605 0-.916.646-1.562T5.542 7.5q.958 0 1.604.646.646.646.646 1.562 0 .959-.646 1.605-.646.645-1.604.645Zm.041 10.25q-.916 0-1.583-.646-.667-.645-.667-1.562t.646-1.562q.646-.646 1.604-.646.917 0 1.563.646.646.645.646 1.562t-.646 1.562q-.646.646-1.563.646Zm0 10.292q-.916 0-1.583-.646-.667-.646-.667-1.562 0-.917.646-1.584.646-.666 1.604-.666.917 0 1.563.666.646.667.646 1.584 0 .916-.646 1.562t-1.563.646Zm6.084-21.375V8.333h21.666v2.792Zm0 10.25v-2.75h18.708q-2.083 0-3.917.729-1.833.729-3.25 2.021Zm0 10.292v-2.792h7.958q-.042.75.021 1.437.062.688.187 1.355Zm18.666 5.708q-3.291 0-5.625-2.354-2.333-2.354-2.333-5.604 0-3.334 2.333-5.688 2.334-2.354 5.667-2.354 3.292 0 5.646 2.354t2.354 5.688q0 3.25-2.354 5.604t-5.688 2.354Zm-.666-2.75h1.458v-4.458h4.458v-1.459h-4.458V24.25h-1.458v4.458h-4.459v1.459h4.459Z"/>
						</svg>
					</div>

					<div className={`navContent ${ this.state.isRefresh ? "refresh" : ""}`}>
						{ this.state.timeDisplay }
					</div>
				</div>
			</div>
		:
		// No event selected
			<div className="content">
				<div className="header">
					<h2>Wrestling</h2>

					<div className="selection">
						<select value={ this.state.eventsSelection } onChange={ this.selectEvents }>
							<option>Current</option>
							<option>Upcoming</option>
							<option>Past</option>
						</select>
					</div>
				</div>

				{
				this.state.eventsSelection && this.state.eventsSelection.toLowerCase() !== "current" ?
				<div className="actions">
					<input type="text" value={ this.state.nameSearch } placeholder="-- Name Search --" onChange={ event => this.setState({ nameSearch: event.target.value }) } />
					<input type="text" value={ this.state.locationSearch } placeholder="-- Location Search --" onChange={ event => this.setState({ locationSearch: event.target.value }) } />
					<div>
						<input id="activeSearch" type="checkbox" checked={ this.state.activeSearch } onChange={ event => this.setState(({ activeSearch: event.target.checked })) } />
						<label htmlFor="activeSearch">Active</label>
					</div>
				</div>
				: ""
				}

				{
				this.state.events
					.filter(event => 
						(!this.state.nameSearch || (new RegExp(this.state.nameSearch, "gi")).test(event.name)) &&
						(!this.state.locationSearch || (new RegExp(this.state.locationSearch, "gi")).test(event.location)) &&
						(this.state.eventsSelection.toLowerCase() === "current" || !this.state.activeSearch || event.hasBrackets)
						)
					.map((event, eventIndex) => 
				<div className={`listItem row ${ event.hasBrackets ? "selectable" : "disabled" }`} key={ eventIndex } onClick={ () => { if (event.hasBrackets) { this.selectEvent(event) } }}>
					<div className="sidebar"></div>

					<div className="listItemContent column">
						<div className="listItemDate">{ event.startDate.toLocaleDateString() }</div>
						<div className="listItemHeader">{ event.name }</div>
						<div className="listItemSubHeader">{ event.location }</div>
					</div>
				</div>
				)
				}
			</div>
		}

			<Toast message={ this.state.toast } />
		</div>
	); }
}

ReactDOM.render(<WrestlingEvent />, document.getElementById("root"));
