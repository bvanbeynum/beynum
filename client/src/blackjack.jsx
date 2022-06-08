import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./blackjack/blackjack.css";
import Game from "./blackjack/game";
import ListGame from "./blackjack/listgame.jsx";
import Engine from "../../lib/blackjack";

class BlackJack extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			games: [],
			toast: { message: "", type: "info" }
		};
	};

	componentDidMount() {
		this.viewGames();
	};

	viewGames = () => {
		this.setState({ isLoading: true }, () => {
			fetch("/api/blackjackload")
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					if (data.hasAccess) {
						this.setState({
							isLoading: false,
							engine: null,
							selectedGameId: null,
							games: this.loadGames(data.games)
						});
					}
					else {
						this.setState({
							isLoading: false,
							isRestricted: true
						});
					}
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		});
	}

	newGame = () => {
		this.setState({
			engine: new Engine()
		})
	};

	selectGame = gameId => {
		this.setState(({ games }) => ({
			selectedGameId: gameId,
			engine: new Engine(games.find(game => game.id === gameId ).transactions)
		}));
	}

	deleteGame = gameId => {
		fetch(`/api/deletegame?gameid=${ gameId }`, { method: "delete", headers: { "Content-Type": "application/json" } })
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(data => {
				this.setState({ games: this.loadGames(data.games) });
			})
			.catch(error => {
				console.warn(error);
				this.setState({ toast: { text: "Error deleting game", type: "error" }});
			});
	};

	loadGames = games => {
		return games.map(game => {
			const endDate = new Date(game.lastUpdate),
				endDisplay = (Date.now() - endDate) > (1000 * 60 * 60 * 24 * 7) ? endDate.toLocaleDateString() // over a week ago
					: (Date.now() - endDate) > (1000 * 60 * 60 * 24) ? Math.floor((Date.now() - endDate) / (1000 * 60 * 60 * 24)) + " day(s) ago"
					: (Date.now() - endDate) > (1000 * 60 * 60) ? Math.floor((Date.now() - endDate) / (1000 * 60 * 60)) + " hour(s) ago"
					: (Date.now() - endDate) > (1000 * 60) ? Math.floor((Date.now() - endDate) / (1000 * 60)) + " minutes ago"
					: "less than a min ago",
				tempMin = Math.min(...game.hands.map(hand => hand.bank)),
				tempMax = Math.max(...game.hands.map(hand => hand.bank)),
				statMin = 200 - Math.max(...[200 - tempMin, tempMax - 200]),
				statMax = 200 + Math.max(...[200 - tempMin, tempMax - 200]),
				statLineHorizontal = game.hands
					.slice(game.hands.length - 50)
					.map((hand, handIndex, handArray) => ({ 
						x: handIndex * 8, 
						y: 50 - (((hand.bank - statMin) * 50) / (statMax - statMin)),
						color: handIndex === 0 ? "#565656"
							: hand.bank > handArray[handIndex - 1].bank ? "#76bf86"
							: hand.bank < handArray[handIndex - 1].bank ? "#c54342"
							: "#565656",
						amount: hand.bank
					}));
			
			return {
				id: game.id,
				start: new Date(game.start),
				end: endDate,
				endDisplay: endDisplay,
				bank: game.hands[game.hands.length - 1].bank,
				hands: game.hands,
				transactions: game.hands.map(hand => hand.bank),
				statLineHorizontal: statLineHorizontal
			};
		});
	};

	gamePlay = action => {
		const engine = this.state.engine;

		switch (action) {
			case "deal":
				engine.Deal();
				break;
			case "hit":
				engine.Play("hit");
				break;
			case "stand":
				engine.Play("stand");
				break;
			case "double":
				engine.Play("double");
				break;
			case "split":
				engine.Play("split");
				break;
		}

		if (!engine.Settings.isPlaying) {
			const saveHand = { 
				player: engine.Hands.player.cards.map(card => card.card),
				split: engine.Hands.split ? engine.Hands.split.cards.map(card => card.card) : null,
				dealer: engine.Hands.dealer.cards.map(card => card.card),
				bank: engine.Settings.bank
			};

			if (this.state.selectedGameId) {
				fetch(`/api/savegamehand?gameid=${ this.state.selectedGameId }`,
					{ method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gamehand: saveHand }) }
					)
					.then(response => {
						if (response.ok) {
							return response.json();
						}
						else {
							throw Error(response.statusText);
						}
					})
					.then(() => {
					})
					.catch(error => {
						console.warn(error);
						this.setState({ toast: { text: "Error saving hand", type: "error" } });
					});
			}
			else {
				fetch("/api/savegame",
					{ method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game: {
						start: engine.Settings.startTime,
						hands: [ saveHand ]
					} }) }
					)
					.then(response => {
						if (response.ok) {
							return response.json();
						}
						else {
							throw Error(response.statusText);
						}
					})
					.then(data => {
						this.setState({ selectedGameId: data.gameid });
					})
					.catch(error => {
						console.warn(error);
						this.setState({ toast: { text: "Error saving new game", type: "error" }});
					});
			}
		}

		this.setState({ engine: engine });
	};

	render() { return (
		<div className="pageContainer">
			
		{
		this.state.isLoading ?
			<div className="loading">
				<img alt="Loading" src="/media/blackjackloading.gif" />
			</div>
		
		: this.state.isRestricted ?
			<div className="loginPage">
				<div className="icon">
					<svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" viewBox="0 0 24 24" fill="black">
						<g>
							<path d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M11,7h2v2h-2V7z M11,11h2v6h-2V11z"/>
						</g>
					</svg>
				</div>
					
				<div className="loginContent">
					<div>
						This is a restricted site that requires pre-approval to use. If you'd like access to this site, please contact the owner.
					</div>
				</div>
			</div>
		:
			<>
			{
			!this.state.engine ?
				<div className="content">
					{
					this.state.games
					.sort((gameA, gameB) => gameB.end - gameA.end)
					.map(game => 
						<ListGame 
						key={ game.id } 
						gameId={ game.id }
						end={ game.endDisplay } 
						hands={ game.hands } 
						bank={ game.bank } 
						statLine={ game.statLineHorizontal } 
						selectGame={ this.selectGame }
						deleteGame={ this.deleteGame }
						closeGame={ this.viewGames } />
					)
					}
				</div>
			:
				<Game engine={ this.state.engine } play={ this.gamePlay } />
			}

			<div className="bottomNav">
				<div className="button">
					{
					this.state.engine ?
					// List
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onClick={ () => { this.viewGames() }}>
						<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
					</svg>
					:
					// New
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onClick={ this.newGame }>
						<path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
					</svg>
					}
				</div>

				<div className="button">
					{/* Bar Chart */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M10 40V18H15V40ZM21.5 40V10H26.5V40ZM33 40V26H38V40Z"/></svg>
				</div>
				
				<div className="button">
					{/* Query Stats */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M43.85 46 37.15 39.3Q36.1 40.05 34.875 40.45Q33.65 40.85 32.35 40.85Q28.8 40.85 26.325 38.375Q23.85 35.9 23.85 32.35Q23.85 28.8 26.325 26.325Q28.8 23.85 32.35 23.85Q35.9 23.85 38.375 26.325Q40.85 28.8 40.85 32.35Q40.85 33.65 40.425 34.875Q40 36.1 39.3 37.2L46 43.85ZM32.35 37.85Q34.65 37.85 36.25 36.25Q37.85 34.65 37.85 32.35Q37.85 30.05 36.25 28.45Q34.65 26.85 32.35 26.85Q30.05 26.85 28.45 28.45Q26.85 30.05 26.85 32.35Q26.85 34.65 28.45 36.25Q30.05 37.85 32.35 37.85ZM4.45 35.55 2 33.75 11.4 18.75 17.4 25.75 25.35 12.85 30.8 20.95Q30 21.05 29.25 21.275Q28.5 21.5 27.75 21.8L25.5 18.35L17.85 30.8L11.8 23.75ZM36.05 21.45Q35.3 21.15 34.5 21.05Q33.7 20.95 32.85 20.85L43.55 4L46 5.8Z"/></svg>
				</div>
			</div>
			</>
		}

			<Toast message={ this.state.toast } />
		</div>
	); }
}

ReactDOM.render(<BlackJack />, document.getElementById("root"));
