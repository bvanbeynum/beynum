import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./blackjack/blackjack.css";
import Game from "./blackjack/game";

class BlackJack extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			toast: { message: "", type: "info" }
		};
	};

	componentDidMount() {
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

				this.setState({
					isLoading: false,
					game: {
						start: new Date(),
						startingAmount: 200,
						currentAmount: 200,
						transactions: [ 200 ],
						playedHands: [],
						statLine: { min: 175, max: 225, line: [{ x: 400, y: 25, color: "#565656", amount: 200 }] }
					}
				});
			})
			.catch(error => {
				console.warn(error);
				this.setState({ isLoading: false, toast: { text: "Error loading data", type: "error" } });
			});
	};

	saveTransaction = transaction => {
		const tempMin = Math.min(...this.state.game.transactions.concat([this.state.game.currentAmount + transaction])),
			tempMax = Math.max(...this.state.game.transactions.concat([ this.state.game.currentAmount + transaction])),
			statMin = 200 - Math.max(...[200 - tempMin, tempMax - 200]),
			statMax = 200 + Math.max(...[200 - tempMin, tempMax - 200]),
			statLine = this.state.game.statLine.line
				.slice(this.state.game.statLine.length - 20)
				.map(point => ({ ...point, x: point.x - 20, y: 47.5 - (((point.amount - statMin) * 45) / (statMax - statMin)) }))
				.concat({
					x: 400,
					y: 47.5 - ((((this.state.game.currentAmount + transaction) - statMin) * 45) / (statMax - statMin)),
					color: this.state.game.currentAmount + transaction > this.state.game.transactions[this.state.game.transactions.length - 1] ? "#76bf86"
						: this.state.game.currentAmount + transaction < this.state.game.transactions[this.state.game.transactions.length - 1] ? "#c54342"
						: "#565656",
					amount: this.state.game.currentAmount + transaction
				});

		this.setState(({ game }) => ({
			game : {
				...game,
				currentAmount: game.currentAmount + transaction,
				transactions: game.transactions.concat(game.currentAmount + transaction),
				statLine: { min: statMin, max: statMax, line: statLine }
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
		:
			<>
			<Game transactionCount={ this.state.game.transactions.length } 
				currentAmount={ this.state.game.currentAmount } 
				statLine={ this.state.game.statLine.line } 
				debit={ amount => { this.setState(({ game }) => ({ game: { ...game, currentAmount: game.currentAmount - amount } }))} }
				saveTransaction={ this.saveTransaction } />

			<div className="bottomNav">
				<div className="button">
					{/* New */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M31.55 9.6 24.1 17.05 22.1 15.05 26.05 11.1H24Q18.65 11.1 14.825 14.925Q11 18.75 11 24.1Q11 25.55 11.275 26.85Q11.55 28.15 11.95 29.3L9.8 31.45Q8.8 29.65 8.4 27.825Q8 26 8 24.1Q8 17.55 12.725 12.825Q17.45 8.1 24 8.1H26.15L22.15 4.1L24.1 2.15ZM16.35 38.55 23.8 31.1 25.75 33.05 21.75 37.05H24Q29.35 37.05 33.175 33.225Q37 29.4 37 24.05Q37 22.6 36.75 21.3Q36.5 20 36 18.85L38.15 16.7Q39.15 18.5 39.575 20.325Q40 22.15 40 24.05Q40 30.6 35.275 35.325Q30.55 40.05 24 40.05H21.75L25.75 44.05L23.8 46Z"/></svg>
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
