import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./blackjack/blackjack.css";
import Game from "./blackjack/game";
import ListGame from "./blackjack/listgame.jsx";
import Simulator from "./blackjack/simulator";
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

	componentWillUnmount() {
		if (this.state.simulator && this.state.simulator.interval) clearInterval(this.state.simulator.interval);
	}
	
	viewGames = () => {
		if (this.state.simulator && this.state.simulator.interval) clearInterval(this.state.simulator.interval);

		this.setState({ isLoading: true, simulator: null }, () => {
			fetch("/bj/api/blackjackload")
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
		if (this.state.simulator && this.state.simulator.interval) clearInterval(this.state.simulator.interval);

		this.setState({
			simulator: null,
			engine: new Engine({ settings: { blackjackPayout: 1.5 }})
		})
	};

	selectGame = gameId => {
		this.setState(({ games }) => ({
			selectedGameId: gameId,
			engine: new Engine({ transactions: games.find(game => game.id === gameId ).transactions, settings: { blackjackPayout: 1.5 } })
		}));
	}

	deleteGame = gameId => {
		fetch(`/bj/api/deletegame?gameid=${ gameId }`, { method: "delete", headers: { "Content-Type": "application/json" } })
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
				tempMin = Math.min(...game.transactions),
				tempMax = Math.max(...game.transactions),
				statMin = 200 - Math.max(...[200 - tempMin, tempMax - 200]),
				statMax = 200 + Math.max(...[200 - tempMin, tempMax - 200]),
				statLineHorizontal = game.transactions
					.slice(game.transactions.length - 50)
					.map((transaction, transactionIndex, transactionArray) => ({ 
						x: transactionIndex * 8, 
						y: 50 - (((transaction - statMin) * 50) / (statMax - statMin)),
						color: transactionIndex === 0 ? "#565656"
							: transaction > transactionArray[transactionIndex - 1] ? "#76bf86"
							: transaction < transactionArray[transactionIndex - 1] ? "#c54342"
							: "#565656",
						amount: transaction
					}));
			
			return {
				id: game.id,
				start: new Date(game.start),
				end: endDate,
				endDisplay: endDisplay,
				bank: game.transactions[game.transactions.length - 1],
				transactions: game.transactions,
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
			if (this.state.selectedGameId) {
				fetch(`/bj/api/savegametransaction?gameid=${ this.state.selectedGameId }`,
					{ method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction: engine.Settings.bank }) }
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
				fetch("/bj/api/savegame",
					{ method: "post", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game: {
						start: engine.Settings.startTime,
						transactions: [ engine.Settings.bank ]
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

	setSimulator = async () => {
		if (this.state.simulator.isRunning) {
			clearInterval(this.state.simulator.interval);
			this.setState(({ simulator }) => ({ simulator: { ...simulator, isRunning: false, interval: null } }));
		}
		else {
			const response = await fetch(`/bj/api/game/new`);

			if (!response.ok) {
				const error = response.json();
				console.warn(error);
				this.setState(({ simulator }) => ({ toast: { text: "Error starting game", type: "error" } }));
				return;
			}

			const game = await response.json();
			this.setState(({ simulator }) => ({ simulator: { ...simulator, game: game, isRunning: true } }),
				() => {
					const simulatorInterval = setInterval(this.runSimulator, 3000);
					this.setState(({ simulator }) => ({ simulator: { ...simulator, interval: simulatorInterval }}))
				}
			);
		}
	};

	runSimulator = async () => {
		let game = this.state.simulator.game;

		if (game.settings.isPlaying) {
			let response = await fetch(`/bj/api/game/play?state=${ game.id }&action=${ game.strategy.display }`);

			if (!response.ok) {
				const error = response.json();
				console.warn(error);
				clearInterval(this.state.simulator.interval);
				this.setState(({ simulator }) => ({ toast: { text: "Error playing game", type: "error" }, simulator: { ...simulator, game: null, isRunning: false, interval: null } }));
				return false;
			}

			game = await response.json();
		}
		else {
			let response = await fetch(`/bj/api/game/deal?state=${ game.id }`);

			if (!response.ok) {
				const error = response.json();
				console.warn(error);
				clearInterval(this.state.simulator.interval);
				this.setState(({ simulator }) => ({ toast: { text: "Error playing game", type: "error" }, simulator: { ...simulator, game: null, isRunning: false, interval: null } }));
				return false;
			}

			game = await response.json();
		}

		const transactions = this.state.simulator.transactions;
		transactions.unshift({
				hand: game.settings.isPlaying ? game.transactions.length : game.transactions.length - 1,
				dealer: game.settings.isPlaying ? game.hands.dealer.cards[0].card : game.hands.dealer.value + " [" + game.hands.dealer.cards.map(card => card.card).join(", ") + "]",
				player: game.hands.player.value + " [" + game.hands.player.cards.map(card => card.card).join(", ") + "]",
				split: game.hands.split ? game.hands.split.value + " [" + game.hands.split.cards.map(card => card.card).join(", ") + "]" : "—",
				result: game.settings.isPlaying ? game.strategy.display 
					: +game.transactions.slice(-1) > +game.transactions.slice(-2, -1) ? "— Win —"
					: +game.transactions.slice(-1) < +game.transactions.slice(-2, -1) ? "— Lose —"
					: "— Push —",
				resultDisplay: game.settings.isPlaying ? null
					: +game.transactions.slice(-1) > +game.transactions.slice(-2, -1) ? "win"
					: +game.transactions.slice(-1) < +game.transactions.slice(-2, -1) ? "lose"
					: "push",
				bank: game.settings.bank
			});
		
		if (!game.settings.isPlaying) {
			transactions.unshift({
				hand: "",
				dealer: "",
				player: "",
				split: "",
				result: "",
				isComplete: false
			});
		}
		
		if (+game.settings.bank - +game.settings.currentBet < 0 || game.transactions.length >= 1000) {
			clearInterval(this.state.simulator.interval);
			transactions.unshift({
				hand: "",
				dealer: "",
				player: "",
				split: "",
				result: "All done here",
				isComplete: false
			});
		}

		this.setState(({ simulator }) => ({
			simulator: {
				...simulator,
				game: game,
				isRunning: game.settings.bank - game.settings.currentBet >= 0 && game.transactions.length < 1000,
				transactions: transactions
			}
		}));
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
			this.state.engine ?
				<Game engine={ this.state.engine } play={ this.gamePlay } />
			: this.state.simulator ?
				<Simulator transactions={ this.state.simulator.transactions } isRunning={ this.state.simulator.isRunning } setState={ this.setSimulator } />
			:
				<div className="content">
					{
					this.state.games
					.sort((gameA, gameB) => gameB.end - gameA.end)
					.map(game => 
						<ListGame 
						key={ game.id } 
						gameId={ game.id }
						end={ game.endDisplay } 
						bank={ game.bank } 
						transactions={ game.transactions }
						statLine={ game.statLineHorizontal } 
						selectGame={ this.selectGame }
						deleteGame={ this.deleteGame }
						closeGame={ this.viewGames } />
					)
					}
				</div>
			}

			<div className="bottomNav">
				<div className="button">
					{
					this.state.engine || this.state.simulator ?
					// List
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onClick={ this.viewGames }>
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
					{/* Robot */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" onClick={ () => { this.setState(({ simulator }) => ({ engine: null, simulator: simulator ? null : { transactions: [] } })) }}>
						<path d="M7.35 29.2Q5.1 29.2 3.55 27.65Q2 26.1 2 23.85Q2 21.6 3.55 20.05Q5.1 18.5 7.35 18.5V12.35Q7.35 11.15 8.25 10.25Q9.15 9.35 10.35 9.35H18.65Q18.65 7.1 20.2 5.55Q21.75 4 24 4Q26.25 4 27.8 5.55Q29.35 7.1 29.35 9.35H37.65Q38.85 9.35 39.75 10.25Q40.65 11.15 40.65 12.35V18.5Q42.9 18.5 44.45 20.05Q46 21.6 46 23.85Q46 26.1 44.45 27.65Q42.9 29.2 40.65 29.2V39Q40.65 40.2 39.75 41.1Q38.85 42 37.65 42H10.35Q9.15 42 8.25 41.1Q7.35 40.2 7.35 39ZM17.15 24.2Q18 24.2 18.575 23.625Q19.15 23.05 19.15 22.2Q19.15 21.35 18.575 20.775Q18 20.2 17.15 20.2Q16.3 20.2 15.725 20.775Q15.15 21.35 15.15 22.2Q15.15 23.05 15.725 23.625Q16.3 24.2 17.15 24.2ZM30.85 24.2Q31.7 24.2 32.275 23.625Q32.85 23.05 32.85 22.2Q32.85 21.35 32.275 20.775Q31.7 20.2 30.85 20.2Q30 20.2 29.425 20.775Q28.85 21.35 28.85 22.2Q28.85 23.05 29.425 23.625Q30 24.2 30.85 24.2ZM15.6 33.75H32.4V30.75H15.6ZM10.35 39H37.65V12.35H10.35ZM10.35 39V12.35V39Z"/>
					</svg>
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
