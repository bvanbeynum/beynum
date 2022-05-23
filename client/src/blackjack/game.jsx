import React, { useState } from "react";

const Game = (props) => {

	const cards = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ],
		suits = [ "♣", "♠", "♥", "♦" ],
		strategyDealer = [...Array(10)].map((a,i) => i < 9 ? (i + 2) + "" : "A"),
		strategyPlayer = [...Array(28)].map((r,i) => i < 10 ? (i + 8) + "" : i < 18 ? "A," + (i - 8) : i < 27 ? (i - 16) + "," + (i - 16) : "A,A"),
		strategyTable = strategyPlayer.map((player, playerIndex) => [ { value: player }, ...strategyDealer.map((dealer, dealerIndex) =>
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

	const [ strategyDisplay, setStrategyDisplay ] = useState("");
	const [ strategyTableIndex, setStrategyTableIndex ] = useState([-1, -1]);
	const [ bank, setBank ] = useState(props.bank);
	const [ transactions, setTransactions ] = useState(props.transactions);
	const [ statLine, setStatLine ] = useState(props.statLine);
	const [ betTotal, setBetTotal ] = useState(0);
	const [ player, setPlayer ] = useState(null);
	const [ split, setSplit ] = useState(null);
	const [ dealer, setDealer ] = useState(null);
	const [ canSplit, setCanSplit ] = useState(false);
	const [ canDouble, setCanDouble ] = useState(false);
	const [ isPlaying, setIsPlaying ] = useState(false);
	const [ deckIndex, setDeckIndex ] = useState(0);
	const [ deck, setDeck ] = useState(suits.map(suit => cards.map(card => ({ suit: suit, card: card }))).flatMap(card => card));

	const calculateValue = hand => {
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
		}
	};

	const calculateStrategy = (playerCards, dealerCards) => {
		const dealerCard = dealerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? 10 : +card.card)[1],
			dealerIndex = strategyDealer.findIndex(strategy => strategy == dealerCard),
			aces = playerCards.filter(card => card.card === "A").map(card => card.card),
			hardTotal = playerCards.filter(card => card.card !== "A").map(card => isNaN(card.card) ? 10 : +card.card).reduce((total, value) => total + +value, 0);

		let playerIndex = -1,
			display = "";
		
		if (aces.length > 0 && hardTotal + (aces.length * 11) <= 21) {
			// Ace
			const remainingValue = calculateValue(playerCards) - 11;
			playerIndex = strategyPlayer.findIndex(strategy => strategy == `A,${ remainingValue }`);
		}
		else if (playerCards.length === 2 && playerCards[0].card === playerCards[1].card) {
			// Split
			playerIndex = strategyPlayer.findIndex(strategy => strategy == playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? "10" : card.card).join(","));
		}
		else {
			// Hard Total
			const currentValue = calculateValue(playerCards);
			playerIndex = strategyPlayer.findIndex(strategy => strategy == currentValue);

			if (playerIndex < 0) {
				display = currentValue < 8 ? "Hit" : "Stand";
			}
		}

		if (dealerIndex >= 0 && playerIndex >= 0) {
			const abbreviation = strategyTable[playerIndex][dealerIndex + 1].value;

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

		setStrategyDisplay(display);
		setStrategyTableIndex([ playerIndex, dealerIndex + 1]);
	};

	const saveHand = (playerHand, splitHand, dealerHand, newBank) => {
		const tempMin = Math.min(...transactions.concat([ newBank ])),
			tempMax = Math.max(...transactions.concat([ newBank])),
			statMin = 200 - Math.max(...[200 - tempMin, tempMax - 200]),
			statMax = 200 + Math.max(...[200 - tempMin, tempMax - 200]),
			newStatLine = statLine
				.slice(statLine - 20)
				.map(point => ({ ...point, x: 50 - (((point.amount - statMin) * 50) / (statMax - statMin)), y: point.y + 20 }))
				.concat({
					x: 50 - ((((newBank) - statMin) * 50) / (statMax - statMin)),
					y: 0,
					color: newBank > transactions[transactions.length - 1] ? "#76bf86"
						: newBank < transactions[transactions.length - 1] ? "#c54342"
						: "#565656",
					amount: newBank
				});
		
		setBank(newBank);
		setTransactions(transactions.concat(newBank));
		setStatLine(newStatLine);
		props.saveHand(playerHand.map(card => card.card), splitHand ? splitHand.map(card => card.card) : null, dealerHand.map(card => card.card), newBank);
	};

	const newDeal = () => {
		const newDeck = deck;

		let currentIndex = newDeck.length,
			temporaryValue,
			randomIndex;
		
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
		
			// And swap it with the current element.
			temporaryValue = deck[currentIndex];
			newDeck[currentIndex] = deck[randomIndex];
			newDeck[randomIndex] = temporaryValue;
		}

		const playerHand = [ newDeck[0], newDeck[2] ],
			dealerHand = [ newDeck[1], newDeck[3] ],
			bet = 10,
			playerValue = calculateValue(playerHand),
			dealerValue = calculateValue(dealerHand);

		setBetTotal(bet);
		setDeck(newDeck);

		setDealer(dealerHand);
		setSplit(null);

		if (playerValue === 21 && dealerValue !== 21) {
			saveHand(playerHand, null, dealerHand, bank + (bet * 1.5));
			setPlayer({ 
				cards: playerHand,
				bet: bet,
				isComplete: true,
				result: 1
			});
			setIsPlaying(false);
		}
		else if (playerValue !== 21 && dealerValue === 21) {
			saveHand(playerHand, null, dealerHand, bank + (-1 * bet));
			setPlayer({ 
				cards: playerHand,
				bet: bet,
				isComplete: true,
				result: -1
			});
			setIsPlaying(false);
		}
		else {
			setBank(bank - bet);
			setPlayer({ 
				cards: playerHand,
				bet: bet,
				isComplete: false
			});
			setIsPlaying(true);
			setCanDouble(true);
			setDeckIndex(4);
			setCanSplit(playerHand[0].card === playerHand[1].card);
			calculateStrategy(playerHand, dealerHand);
		}
	};

	const play = action => {
		let playerData = player,
			splitData = split,
			dealerData = dealer,
			index = deckIndex,
			doubleUpdate = canDouble,
			splitUpdate = canSplit,
			bet = betTotal,
			bankUpdate = bank;

		if (action === "hit") {
			if (!playerData.isComplete) {
				playerData.cards.push(deck[index]);
				index += 1;
				const playerValue = calculateValue(playerData.cards);
				playerData.isComplete = playerValue >= 21;
			}
			else if (splitData) {
				splitData.cards.push(deck[index]);
				index += 1;
				const splitValue = calculateValue(splitData.cards);
				splitData.isComplete = splitValue >= 21;
			}
	
			doubleUpdate = false;
			splitUpdate = false;
		}
		else if (action === "double") {
			if (!playerData.isComplete) {
				playerData.cards.push(deck[index]);
				index += 1;
				playerData.isComplete = true;
				bet = bet + playerData.bet;
				bankUpdate = bankUpdate - playerData.bet;
				playerData.bet = playerData.bet * 2;
			}
			else if (splitData) {
				splitData.cards.push(deck[index]);
				index += 1;
				splitData.isComplete = true;
				bet = bet + splitData.bet;
				bankUpdate = bankUpdate - splitData.bet;
				splitData.bet = splitData.bet * 2;
			}

			doubleUpdate = false;
			splitUpdate = false;
		}
		else if (action === "stand") {
			if (!playerData.isComplete) {
				playerData.isComplete = true;
			}
			else if (splitData) {
				splitData.isComplete = true;
			}
	
			doubleUpdate = false;
			splitUpdate = false;
		}
		else if (action === "split") {
			splitData = {
				cards: [ playerData.cards.pop() ],
				bet: playerData.bet
			};
			
			playerData.cards.push(deck[index]);
			index += 1;
			const playerValue = calculateValue(playerData.cards);
			playerData.isComplete = playerValue === 21;
			playerData.isBlackJack = playerValue === 21;
			bet = bet + playerData.bet;
			bankUpdate = bankUpdate - playerData.bet;

			doubleUpdate = false;
			splitUpdate = false;
		}

		if (playerData.isComplete && splitData && !splitData.isComplete && splitData.cards.length === 1) {
			// Start the split deck
			splitData.cards.push(deck[index]);
			index += 1;
			const splitValue = calculateValue(splitData.cards);
			splitData.isComplete = splitValue === 21;
			splitData.isBlackJack = splitValue === 21;

			doubleUpdate = splitValue !== 21;
			splitUpdate = false;
		}

		if (playerData.isComplete && (!splitData || splitData.isComplete)) {
			let playerValue = calculateValue(playerData.cards),
				splitValue = splitData ? calculateValue(splitData.cards) : null,
				dealerValue = calculateValue(dealerData),
				transaction = 0;
			
			if (playerValue <= 21 || (splitValue && splitValue <=21)) {
				while (dealerValue < 17 && dealerValue < 21 && dealerData.length < 5) {
					dealerData.push(deck[index]);
					index += 1;
					dealerValue = calculateValue(dealerData);
				}
			}
			
			if (playerData.isBlackJack && !dealerValue !== 21) {
				transaction += playerData.bet * 2.5;
				playerData.result = 1;
			}
			else if (playerValue === dealerValue) {
				transaction += playerData.bet;
				playerData.result = 0;
			}
			else if (playerValue <= 21 && (playerValue > dealerValue || dealerValue > 21)) {
				transaction += playerData.bet * 2;
				playerData.result = 1;
			}
			else {
				playerData.result = -1;
			}

			if (splitValue) {
				if (splitData.isBlackJack && !dealerValue !== 21) {
					transaction += splitData.bet * 2.5;
					splitData.result = 1;
				}
				else if (splitValue === dealerValue) {
					transaction += splitData.bet;
					splitData.result = 0;
				}
				else if (splitValue <= 21 && (splitValue > dealerValue || dealerValue > 21)) {
					transaction += splitData.bet * 2;
					splitData.result = 1;
				}
				else {
					splitData.result = -1;
				}
			}

			saveHand(playerData.cards, splitData ? splitData.cards : null, dealerData, bankUpdate + transaction);
			setIsPlaying(false);
		}
		else {
			calculateStrategy(playerData.isComplete ? splitData.cards : playerData.cards, dealerData);
			setBank(bankUpdate);
		}

		setDeckIndex(index);
		setCanDouble(doubleUpdate);
		setCanSplit(splitUpdate);
		setBetTotal(bet);
		setPlayer(playerData);
		setSplit(splitData);
		setDealer(dealerData);
	};

	return (
		
	<div className="content">

		<div className="topNav">
			<div className="gameStat">{ transactions.length }</div>
			<div className="gameLabel">#</div>
			<div className="gameStat">{ bank }</div>
			<div className="gameLabel">$</div>
			<div className="gameStat">{ betTotal }</div>
			<div className="gameLabel">$</div>
			<div className="gameStat strategyDisplay">{ strategyDisplay }</div>
		</div>

		<div className="gameContent">
			<div className="rowContainer">

				<table className="strategy">
				<thead>
				<tr>
					<th></th>
				{
				strategyDealer.map((column, columnIndex) =>
					<th key={ columnIndex }>{ column }</th>
				)
				}
				</tr>
				</thead>
				<tbody>
				{
				strategyTable.map((row, rowIndex) =>
				<tr key={ rowIndex }>
					{
					row.map((column, columnIndex) =>
						<td key={ columnIndex } className={ `${ column.value } ${ rowIndex === strategyTableIndex[0] && columnIndex === strategyTableIndex[1] ? "highlight" : "" }` }>{ column.value }</td>
					)
					}
				</tr>
				)
				}
				</tbody>
				</table>

				{
				statLine.length > 0 ?
				<svg viewBox="-5 -5 60 400" className="statLine vertical" preserveAspectRatio="xMidYMin">
					<line x1="25" x2="25" y1="0" y2="400" />
					<path d={ `M${ statLine[0].x } ${ statLine[0].y } ${ statLine.slice(1).map(point => `L${ point.x } ${ point.y }`).join(" ") }` } />

					{ statLine.map((point, pointIndex) => 
						<circle key={ pointIndex } cx={ point.x } cy={ point.y } r="2" fill={ point.color } />
					)}
				</svg>
				: ""
				}

			</div>
		
			<div className="rowContainer">
				
				<div className="actionContainer">
					<div className={ `button ${ !isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(118 191 134)', borderColor: 'rgb(46 124 46)' }} onClick={ () => { if (isPlaying) { play("hit") }} }>Hit</div>
					<div className={ `button ${ !isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(197 67 66)', borderColor: 'rgb(116 50 50)' }} onClick={ () => { if (isPlaying) { play("stand") }} }>Stand</div>
					<div className={ `button ${ !isPlaying || !canDouble ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (isPlaying && canDouble) { play("double") }} }>Double</div>
					<div className={ `button ${ !isPlaying || !canSplit ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(226 195 106)', borderColor: 'rgb(157 132 59)' }} onClick={ () => { if (isPlaying && canSplit) { play("split") }} }>Split</div>
					<div className={ `button ${ isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (!isPlaying) { newDeal() }} }>Deal</div>
				</div>
				
				<div className="cardsContainer">
					<div className="handContainer">

					{
					!isPlaying && player ?
						<div className="result">
							{ player.result === -1 && (!split || (split.result === -1)) ? `${ calculateValue(dealer) } Win`
								: player.result === 1 || (split && split.result === 1) ? `${ calculateValue(dealer) } Lose`
								: player.result === 0 ? `${ calculateValue(dealer) } Push`
								: ""
							}
						</div>
					: ""
					}

					{
					dealer ?
					dealer.map((card, cardIndex) =>
						<div className={ `card ${ (cardIndex > 0 || !isPlaying) && (card.suit === "♥" || card.suit === "♦") ? "cardRed" : "" }` } key={ cardIndex }>
							<div className="cardText">{ cardIndex > 0 || !isPlaying ? card.card : "?" }</div>
							<div className="cardText">{ cardIndex > 0 || !isPlaying ? card.suit : "" }</div>
							<div className="cardText">{ cardIndex > 0 || !isPlaying ? card.suit : "" }</div>
							<div className="cardText">{ cardIndex > 0 || !isPlaying ? card.card : "?" }</div>
						</div>
					)
					: ""
					}

					</div>
					
					<div className="handContainer">
					{
					!isPlaying && player ?
						<div className="result">
							{ player.result === 1 ? `${ calculateValue(player.cards) } Win` 
								: player.result === -1 ? `${ calculateValue(player.cards) } Lose`
								: player.result === 0 ? `${ calculateValue(player.cards) } Push`
								: ""
							}
						</div>
					: ""
					}
					{
					player ? 
					player.cards.map((card, cardIndex) => 
						<div className={ `card ${ card.suit === "♥" || card.suit === "♦" ? "cardRed" : "" }` } key={ cardIndex }>
							<div className="cardText">{ card.card }</div>
							<div className="cardText">{ card.suit }</div>
							<div className="cardText">{ card.suit }</div>
							<div className="cardText">{ card.card }</div>
						</div>
					)
					: "" }
					</div>
					
					{
					split ?
						<div className="handContainer">
						{
						!isPlaying ?
							<div className="result">
								{ split.result === 1 ? `${ calculateValue(split.cards) } Win`
									: split.result === -1 ? `${ calculateValue(split.cards) } Lose`
									: split.result === 0 ? `${ calculateValue(split.cards) } Push`
									: ""
								}
							</div>
						: ""
						}
						{
						split.cards.map((card, cardIndex) => 
							<div className={ `card ${ card.suit === "♥" || card.suit === "♦" ? "cardRed" : "" }` } key={ cardIndex }>
								<div className="cardText">{ card.card }</div>
								<div className="cardText">{ card.suit }</div>
								<div className="cardText">{ card.suit }</div>
								<div className="cardText">{ card.card }</div>
							</div>
						)
						}
						</div>
					: "" }
				</div>
			
			</div>
		</div>

	</div>

	)

}

export default Game;
