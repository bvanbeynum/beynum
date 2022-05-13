import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/blackjack.css";

const cards = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ],
	suits = [ "♣", "♠", "♥", "♦" ];

class BlackJack extends Component {

	constructor(props) {
		super(props);

		const dealer = [...Array(10)].map((a,i) => i < 9 ? (i + 2) + "" : "A"),
			player = [...Array(28)].map((r,i) => i < 10 ? (i + 8) + "" : i < 18 ? "A," + (i - 8) : i < 27 ? (i - 16) + "," + (i - 16) : "A,A"),
			table = player.map((player, playerIndex) => [ { value: player }, ...dealer.map((dealer, dealerIndex) =>
				playerIndex === 0 ? { value: "H" }
				: playerIndex === 1 ?
					dealerIndex < 1 ? { value: "H" }
					: dealerIndex < 5 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 2 ?
					dealerIndex < 8 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 3 ?
					dealerIndex < 9 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 4 ?
					dealerIndex < 2 ? { value: "H" }
					: dealerIndex < 5 ? { value: "S" }
					: { value: "H" }
				: playerIndex >= 5 && playerIndex <= 8 ?
					dealerIndex < 5 ? { value: "S" }
					: { value: "H" }
				: playerIndex === 9 ? { value: "S" }
				: playerIndex === 10 || playerIndex === 11 ?
					dealerIndex < 3 ? { value: "H" }
					: dealerIndex < 5 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 12 || playerIndex === 13 ?
					dealerIndex < 2 ? { value: "H" }
					: dealerIndex < 5 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 14 ?
					dealerIndex < 1 ? { value: "H" }
					: dealerIndex < 5 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 15 ?
					dealerIndex < 1 ? { value: "S" }
					: dealerIndex < 5 ? { value: "D" }
					: dealerIndex < 7 ? { value: "S" }
					: { value: "H" }
				: playerIndex === 16 || playerIndex === 17 ? { value: "S" }
				: playerIndex === 18 || playerIndex === 19 ?
					dealerIndex < 6 ? { value: "P" }
					: { value: "H" }
				: playerIndex === 20 ?
					dealerIndex < 3 ? { value: "H" }
					: dealerIndex < 5? { value: "P" }
					: { value: "H" }
				: playerIndex === 21 ?
					dealerIndex < 8 ? { value: "D" }
					: { value: "H" }
				: playerIndex === 22 ?
					dealerIndex < 5 ? { value: "P" }
					: { value: "H" }
				: playerIndex === 23 ?
					dealerIndex < 6 ? { value: "P" }
					: { value: "H" }
				: playerIndex === 24 ? { value: "P" }
				: playerIndex === 25 ?
					dealerIndex < 5 ? { value: "P" }
					: dealerIndex < 6 ? { value: "S" }
					: dealerIndex < 8 ? { value: "P" }
					: { value: "S" }
				: playerIndex === 26 ? { value: "S" }
				: playerIndex === 27 ? { value: "P" }
				: null
			)]);

		this.state = {
			isLoading: true,
			strategy: { dealer: dealer, player: player, table: table },
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
						amountHistory: [ 200 ],
						playedHands: [],
						statLine: { min: 150, max: 250, line: [{ x: 400, y: 25, color: "#565656", amount: 200 }] }
					}
				});

				this.newDeal();
			})
			.catch(error => {
				console.warn(error);
				this.setState({ isLoading: false, toast: { text: "Error loading data", type: "error" } });
			});
	};

	newDeal = () => {
		const deck = suits.map(suit => cards.map(card => ({ suit: suit, card: card }))).flatMap(card => card);

		let currentIndex = deck.length,
			temporaryValue,
			randomIndex;
		
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
		
			// And swap it with the current element.
			temporaryValue = deck[currentIndex];
			deck[currentIndex] = deck[randomIndex];
			deck[randomIndex] = temporaryValue;
		}

		const playerHand = [ deck[0], deck[2] ],
			dealerHand = [ deck[1], deck[3] ],
			bet = 10,
			playerValue = this.calculateValue(playerHand),
			dealerValue = this.calculateValue(dealerHand);

		this.setState(({ game }) => ({
			game: {
				...game,
				currentAmount: game.currentAmount - bet,
				deck: deck,
				deckIndex: 4,
				isPlaying: true,
				totalBet: bet,
				buttonStates: {
					canSplit: playerHand[0].card === playerHand[1].card && playerValue !== 21 && dealerValue !== 21,
					canDouble: true
				},
				player: {
					bet: bet,
					cards: playerHand,
					result: null,
					isBlackJack: playerValue === 21 && dealerValue !== 21,
					isComplete: false
				},
				dealer: dealerHand,
				split: null
			}
		}), () => {
			if (this.calculateValue(this.state.game.dealer) === 21 || this.state.game.player.isBlackJack) {
				this.completeHand();
			}
			else {
				this.selectStrategy();
			}
		});
	};

	hit = () => {
		const cards = !this.state.game.player.isComplete ? this.state.game.player.cards : this.state.game.split.cards;
		let index = this.state.game.deckIndex;

		cards.push(this.state.game.deck[index]);
		index += 1;
		const playerValue = this.calculateValue(cards);

		this.setState(({ game }) => ({
			game: {
				...game,
				deckIndex: index,
				buttonStates: {
					canSplit: false,
					canDouble: false
				},
				player: game.player.isComplete ? game.player
					: {
						...game.player,
						cards: cards,
						isComplete: playerValue >= 21
					},
				split: !game.player.isComplete ? game.split
					: {
						...game.split,
						cards: cards,
						isComplete: playerValue >= 21
					}
			}
		}), () => {
			if (this.state.game.player.isComplete && (!this.state.game.split || this.state.game.split.isComplete)) {
				this.completeHand();
			}
			else if (this.state.game.player.isComplete && this.state.game.split && !this.state.game.split.isComplete && this.state.game.split.cards.length === 1) {
				// Switch to split deck
				const cards = this.state.game.split.cards;
				let index = this.state.game.deckIndex;

				cards.push(this.state.game.deck[index]);
				index += 1;
				const currentValue = this.calculateValue(cards);

				this.setState(({ game }) => ({
					game: {
						...game,
						deckIndex: index,
						isPlaying: currentValue !== 21,
						buttonStates: {
							canSplit: false,
							canDouble: currentValue !== 21
						},
						split: {
							...game.split,
							cards: cards,
							isBlackJack: currentValue === 21,
							isComplete: currentValue === 21
						}
					}
				}), () => {
					if (this.state.game.split.isBlackJack) {
						this.completeHand();
					}
					else {
						this.selectStrategy();
					}
				})
			}
			else {
				this.selectStrategy();
			}
		});

	};

	stand = () => {
		let index = this.state.game.deckIndex,
			cards = null,
			newValue = null;
		if (!this.state.game.player.isComplete && this.state.game.split) {
			cards = this.state.game.split.cards;
			cards.push(this.state.game.deck[index]);
			index += 1;
			newValue = this.calculateValue(cards);
		}

		this.setState(({ game }) => ({
			game: {
				...game,
				deckIndex: index,
				buttonStates: {
					canSplit: !game.player.isComplete && this.state.game.split && cards[0].card === cards[1].card, // If the next deck is split and the cards match
					canDouble: !game.player.isComplete && this.state.game.split && newValue !== 21 // If the next deck is split and didn't blackjack
				},
				player: game.player.isComplete ? game.player : { ...game.player, isComplete: true },
				split: !game.split ? null
					: !game.player.isComplete ? { ...game.split, cards: cards, isBlackJack: newValue === 21, isComplete: newValue === 21 } 
					: { ...game.split, isComplete: true }
			}
		}), () => {
			if (this.state.game.player.isComplete && (!this.state.game.split || this.state.game.split.isComplete)) {
				this.completeHand();
			}
			else {
				this.selectStrategy();
			}
		});
	};

	double = () => {
		const cards = !this.state.game.player.isComplete ? this.state.game.player.cards : this.state.game.split.cards;
		let index = this.state.game.deckIndex,
			newCards = null,
			newValue = null;

		cards.push(this.state.game.deck[index]);
		index += 1;

		if (!this.state.game.player.isComplete && this.state.game.split) {
			// Player is now complete. Add next card to split deck
			newCards = this.state.game.split.cards;
			newCards.push(this.state.game.deck[index]);
			index += 1;
			newValue = this.calculateValue(newCards);
		}

		this.setState(({ game }) => ({
			game: { 
				...game,
				deckIndex: index,
				buttonStates: {
					canSplit: !game.player.isComplete && this.state.game.split && cards[0].card === cards[1].card, // If the next deck is split and the cards match
					canDouble: !game.player.isComplete && this.state.game.split && newValue !== 21 // If the next deck is split and didn't blackjack
				},
				currentAmount: game.currentAmount - (!game.player.isComplete ? game.player.bet : game.split.bet),
				totalBet: game.totalBet + game.player.bet,
				player: game.player.isComplete ? game.player : { ...game.player, cards: cards, bet: game.player.bet * 2, isComplete: true },
				split: !game.split ? null
					: !game.player.isComplete ? { ...game.split, cards: newCards, isBlackJack: newValue === 21, isComplete: newValue === 21 } 
					: { ...game.split, cards: cards, bet: game.split.bet * 2, isComplete: true }
			}
		}), () => {
			if (this.state.game.player.isComplete && (!this.state.game.split || this.state.game.split.isComplete)) {
				this.completeHand();
			}
			else {
				this.selectStrategy();
			}
		});
	};

	split = () => {
		const cards = this.state.game.player.cards,
			splitCard = [ cards.pop() ];
		let index = this.state.game.deckIndex;
		
		cards.push(this.state.game.deck[index]);
		index += 1;
		const currentValue = this.calculateValue(cards);

		this.setState(({ game }) => ({
			game: {
				...game,
				deckIndex: index,
				currentAmount: game.currentAmount - game.player.bet,
				totalBet: game.totalBet + game.player.bet,
				buttonStates: {
					canSplit: false,
					canDouble: currentValue !== 21
				},
				player: {
					...game.player,
					cards: cards,
					isBlackJack: currentValue === 21,
					isComplete: currentValue === 21
				},
				split: {
					...game.player,
					cards: splitCard
				}
			}
		}), () => {
			if (this.state.game.player.isBlackJack) {
				// If the first hand is a black jack, set the next hand to the split hand
				const cards = this.state.game.split.cards;
				let index = this.state.game.deckIndex;
				
				cards.push(this.state.game.deck[index]);
				index += 1;
				const currentValue = this.calculateValue(cards);

				this.setState(({ game }) => ({
					game: {
						...game,
						deckIndex: index,
						buttonStates: {
							canSplit: false,
							canDouble: currentValue !== 21
						},
						split: {
							...game.split,
							cards: cards,
							isBlackJack: currentValue === 21,
							isComplete: currentValue === 21
						}
					}
				}), () => {
					if (this.state.game.split.isComplete) {
						this.completeHand();
					}
					else {
						this.selectStrategy();
					}
				});
			}
			else {
				this.selectStrategy();
			}
		});
	};

	completeHand = () => {
		const playerValue = this.calculateValue(this.state.game.player.cards),
			splitValue = this.state.game.split ? this.calculateValue(this.state.game.split.cards) : null,
			dealerResults = !this.state.game.player.isBlackJack && // Don't play dealer hand if player has blackjack or busts
				(playerValue <= 21 || (splitValue || 22) < 21) ? 
					this.dealerPlay() 
					: { cards: this.state.game.dealer, index: this.state.game.deckIndex },
			dealerValue = this.calculateValue(dealerResults.cards);
		
		let resultPlayer = null,
			resultSplit = null,
			transaction = 0;

		if (this.state.game.player.isBlackJack && dealerValue !== 21) {
			resultPlayer = 1;
			transaction += this.state.game.player.bet * 2.5;
		}
		else if (playerValue === dealerValue) {
			resultPlayer = 0;
			transaction += this.state.game.player.bet;
		}
		else if (playerValue <= 21 && (playerValue > dealerValue || dealerValue > 21)) {
			resultPlayer = 1;
			transaction += this.state.game.player.bet * 2;
		}
		else {
			resultPlayer = -1;
		}

		if (this.state.game.split) {
			if (this.state.game.split.isBlackJack && dealerValue !== 21) {
				resultSplit = 1;
				transaction += this.state.game.split.bet * 2.5;
			}
			else if (splitValue === dealerValue) {
				resultSplit = 0;
				transaction += this.state.game.split.bet;
			}
			else if (splitValue <= 21 && (splitValue > dealerValue || dealerValue > 21)) {
				resultSplit = 1;
				transaction += this.state.game.split.bet * 2;
			}
			else {
				resultSplit = -1;
			}
		}

		const player = {
					...this.state.game.player,
					result: resultPlayer,
					bet: this.state.game.player.isBlackJack ? this.state.game.player.bet * 1.5 : this.state.game.player.bet
				},
			split = this.state.game.split ? {
					...this.state.game.split,
					result: resultSplit,
					bet: this.state.game.split.isBlackJack ? this.state.game.split.bet * 1.5 : this.state.game.split.bet
				} : null,
			dealer = dealerResults.cards,
			tempMin = Math.min(...this.state.game.amountHistory.concat(this.state.game.statLine.min)),
			tempMax = Math.max(...this.state.game.amountHistory.concat(this.state.game.statLine.max)),
			statMin = 200 - Math.max(...[200 - tempMin, tempMax - 200]),
			statMax = 200 + Math.max(...[200 - tempMin, tempMax - 200]),
			statLine = this.state.game.statLine.line
				.slice(this.state.game.statLine.length - 40)
				.map(point => ({ ...point, x: point.x - 10, y: 50 - (((point.amount - statMin) * 50) / (statMax - statMin)) }))
				.concat({
					x: 400,
					y: 50 - ((((this.state.game.currentAmount + transaction) - statMin) * 50) / (statMax - statMin)),
					color: transaction > this.state.game.player.bet + (this.state.game.split ? this.state.game.split.bet : 0) ? "#76bf86"
						: transaction === 0 ? "#c54342"
						: "#565656",
					amount: this.state.game.currentAmount + transaction
				});

		this.setState(({ game }) => ({
			game: {
				...game,
				deckIndex: dealer.index,
				player: player,
				split: split,
				dealer: dealer,
				currentAmount: game.currentAmount + transaction,
				amountHistory: game.amountHistory.concat(game.currentAmount + transaction),
				buttonStates: {
					canSplit: false,
					canDouble: false
				},
				isPlaying: false,
				playedHands: game.playedHands.concat({ 
					player: { isBlackJack: player.isBlackJack, result: player.result }, 
					split: this.state.game.split ? { isBlackJack: split.isBlackJack, result: split.result } : null,
					transaction: transaction - game.player.bet - (game.split ? game.split.bet : 0)
				}),
				statLine: { min: statMin, max: statMax, line: statLine }
			}
		}));
	}

	dealerPlay = () => {
		const deck = this.state.game.deck,
			cards = this.state.game.dealer;

		let index = this.state.game.deckIndex,
			dealerValue = this.calculateValue(cards);
		
		while (dealerValue <= 17 && dealerValue < 21 && cards.length < 5) {
			cards.push(deck[index]);
			index += 1;
			dealerValue = this.calculateValue(cards);
		}

		return {
			cards: cards,
			index: index
		}
	};

	calculateValue = hand => {
		const hardTotal = hand.filter(card => card.card !== "A").map(card => isNaN(card.card) ? 10 : +card.card).reduce((total, value) => total + value, 0),
			aces = hand.filter(card => card.card === "A").map(() => 11);
		
		if (aces.length === 0) {
			return hardTotal;
		}
		else if (hardTotal + aces.length > 21) {
			return hardTotal + aces.length;
		}
		else if (hardTotal + (aces.length * 11) <= 21) {
			return hardTotal + (aces.length * 11);
		}
		else if (aces.length === 1) {
			return hardTotal + aces.length;
		}
		else {
			let value = hardTotal;

			for (let acesIndex = 1; acesIndex < aces.length; acesIndex++) {
				value = hardTotal + ((aces.length - acesIndex) * 11) + (acesIndex * 1);

				if (value < 21) {
					return value;
				}
			}

			return value;
			// return aces.reduce((total, value, index) => hardTotal + ((aces.length - (index + 1)) * 11) + ((index + 1) * 1) > 21 ? total : hardTotal + ((aces.length - (index + 1)) * 11) + ((index + 1) * 1), hardTotal);
		}
	};

	selectStrategy = () => {
		const dealerCard = this.state.game.dealer.map(card => card.card === "A" ? "A" : isNaN(card.card) ? 10 : +card.card)[1],
			dealerIndex = this.state.strategy.dealer.findIndex(strategy => strategy == dealerCard),
			playerCards = this.state.game.player.isComplete && this.state.game.split ? this.state.game.split.cards
				: this.state.game.player.cards;
		let playerIndex = -1,
			display = "";
		
		if (playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? "10" : card.card).includes("A")) {
			// Ace
			const playerString = playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? "10" : card.card).sort((cardA, cardB) => cardA > cardB ? -1 : 1).join(",");
			playerIndex = this.state.strategy.player.findIndex(strategy => strategy == playerString);
		}
		else if (playerCards.length === 2 && playerCards[0].card === playerCards[1].card) {
			// Split
			playerIndex = this.state.strategy.player.findIndex(strategy => strategy == playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? "10" : card.card).join(","));
		}
		else {
			// Hard Total
			const cardValue = playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? 10 : +card.card).reduce((total, value) => total + +value, 0);
			playerIndex = this.state.strategy.player.findIndex(strategy => strategy == cardValue);

			if (playerIndex < 0) {
				display = cardValue < 8 ? "Hit" : "Stand";
			}
		}

		console.log(`r: ${ playerIndex }, c: ${ dealerIndex }`);
		if (dealerIndex >= 0 && playerIndex >= 0) {
			const abbreviation = this.state.strategy.table[playerIndex][dealerIndex + 1].value;

			switch (abbreviation) {
				case "H":
					display = "Hit";
					break;
				case "S":
					display = "Stand";
					break;
				case "D":
					display = "Double";
					break;
				case "P":
					display = "Split";
					break;
			}
		}

		this.setState(({ strategy }) => ({
			strategy: {
				...strategy,
				table: playerIndex >= 0 && dealerIndex >= 0 ? strategy.table.map((row, rowIndex) => row.map((column, columnIndex) => ({ ...column, highlight: rowIndex === playerIndex && columnIndex === (dealerIndex + 1) })))
					: strategy.table.map((row, rowIndex) => row.map((column, columnIndex) => ({ ...column, highlight: false }))),
				display: display
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
			<div className="content">

				<div className="topNav">
					<div className="gameStat">{ this.state.game ? this.state.game.playedHands.length : 0 }</div>
					<div className="gameLabel">#</div>
					<div className="gameStat">{ this.state.game ? this.state.game.currentAmount : 0 }</div>
					<div className="gameLabel">$</div>
					<div className="gameStat">{ this.state.game.totalBet || "-" }</div>
					<div className="gameLabel">$</div>
					<div className="gameStat strategyDisplay">{ this.state.strategy.display }</div>
				</div>

				<svg viewBox="5 0 405 50" className="statLine" preserveAspectRatio="xMidYMin">
					<line x1="0" x2="400" y1="25" y2="25" />
					<path d={ `M${ this.state.game.statLine.line[0].x } ${ this.state.game.statLine.line[0].y } ${ this.state.game.statLine.line.slice(1).map(point => `L${ point.x } ${ point.y }`).join(" ") }` } />
				{
				this.state.game.statLine.line.map((point, pointIndex) => 
					<circle key={ pointIndex } cx={ point.x } cy={ point.y } r="2" fill={ point.color } />
				)
				}
				</svg>

			{
			this.state.game.deck ?
				<>
				<div className="handContainer">

				{
				!this.state.game.isPlaying ?
					<div className="result">
						{ this.state.game.player.result === -1 && (!this.state.game.split || this.state.game.split.result === -1) ? `${ this.calculateValue(this.state.game.dealer) } Win`
							: this.state.game.player.result === 1 || (this.state.game.split && this.state.game.split.result === 1) ? `${ this.calculateValue(this.state.game.dealer) } Lose`
							: this.state.game.player.result === 0 ? `${ this.calculateValue(this.state.game.dealer) } Push`
							: ""
						}
					</div>
				: ""
				}

				{
				this.state.game.dealer.map((card, cardIndex) =>
					<div className={ `card ${ (cardIndex > 0 || !this.state.game.isPlaying) && (card.suit === "♥" || card.suit === "♦") ? "cardRed" : "" }` } key={ cardIndex }>
						<div className="cardText">{ cardIndex > 0 || !this.state.game.isPlaying ? card.card : "?" }</div>
						<div className="cardText">{ cardIndex > 0 || !this.state.game.isPlaying ? card.suit : "" }</div>
						<div className="cardText">{ cardIndex > 0 || !this.state.game.isPlaying ? card.suit : "" }</div>
						<div className="cardText">{ cardIndex > 0 || !this.state.game.isPlaying ? card.card : "?" }</div>
					</div>
				)
				}

				</div>
				
				<div className="handContainer">
				{
				!this.state.game.isPlaying ?
					<div className="result">
						{ this.state.game.player.result === 1 ? `${ this.calculateValue(this.state.game.player.cards) } Win` 
							: this.state.game.player.result === -1 ? `${ this.calculateValue(this.state.game.player.cards) } Lose`
							: this.state.game.player.result === 0 ? `${ this.calculateValue(this.state.game.player.cards) } Push`
							: ""
						}
					</div>
				: ""
				}
				{
				this.state.game.player.cards.map((card, cardIndex) => 
					<div className={ `card ${ card.suit === "♥" || card.suit === "♦" ? "cardRed" : "" }` } key={ cardIndex }>
						<div className="cardText">{ card.card }</div>
						<div className="cardText">{ card.suit }</div>
						<div className="cardText">{ card.suit }</div>
						<div className="cardText">{ card.card }</div>
					</div>
				)
				}
				</div>
				
				{
				this.state.game.split ?
					<div className="handContainer">
					{
					!this.state.game.isPlaying ?
						<div className="result">
							{ this.state.game.split.result === 1 ? `${ this.calculateValue(this.state.game.split.cards) } Win`
								: this.state.game.split.result === -1 ? `${ this.calculateValue(this.state.game.split.cards) } Lose`
								: this.state.game.split.result === 0 ? `${ this.calculateValue(this.state.game.split.cards) } Push`
								: ""
							}
						</div>
					: ""
					}
					{
					this.state.game.split.cards.map((card, cardIndex) => 
						<div className={ `card ${ card.suit === "♥" || card.suit === "♦" ? "cardRed" : "" }` } key={ cardIndex }>
							<div className="cardText">{ card.card }</div>
							<div className="cardText">{ card.suit }</div>
							<div className="cardText">{ card.suit }</div>
							<div className="cardText">{ card.card }</div>
						</div>
					)
					}
					</div>
				: ""
				}

				<div className="bottomContainer">

					<table className="strategy">
					<thead>
					<tr>
						<th></th>
					{
					this.state.strategy.dealer.map((column, columnIndex) =>
						<th key={ columnIndex }><pre>{ column }</pre></th>
					)
					}
					</tr>
					</thead>
					<tbody>
					{
					this.state.strategy.table.map((row, rowIndex) =>
					<tr key={ rowIndex }>
					{
					row.map((column, columnIndex) =>
						<td key={ columnIndex } className={ `${ column.value } ${ column.highlight ? "highlight" : "" }` }>{ column.value }</td>
					)
					}
					</tr>
					)
					}
					</tbody>
					</table>

					<div className="actionContainer">
						<div className={ `button ${ !this.state.game.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(118 191 134)', borderColor: 'rgb(46 124 46)' }} onClick={ () => { if (this.state.game.isPlaying) { this.hit() }} }>Hit</div>
						<div className={ `button ${ !this.state.game.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(197 67 66)', borderColor: 'rgb(116 50 50)' }} onClick={ () => { if (this.state.game.isPlaying) { this.stand() }} }>Stand</div>
						<div className={ `button ${ !this.state.game.isPlaying || !this.state.game.buttonStates.canDouble ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (this.state.game.isPlaying && this.state.game.buttonStates.canDouble) { this.double() }} }>Double</div>
						<div className={ `button ${ !this.state.game.isPlaying || !this.state.game.buttonStates.canSplit ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(226 195 106)', borderColor: 'rgb(157 132 59)' }} onClick={ () => { if (this.state.game.isPlaying && this.state.game.buttonStates.canSplit) { this.split() }} }>Split</div>
						<div className={ `button ${ this.state.game.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (!this.state.game.isPlaying) { this.newDeal() }} }>Deal</div>
					</div>
					
				</div>
				
				</>
			: ""
			}
			</div>

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
