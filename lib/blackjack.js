const cards = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ],
	suits = [ "♣", "♠", "♥", "♦" ],
	strategy = {
		dealer: [...Array(10)].map((a,i) => i < 9 ? (i + 2) + "" : "A"),
		player: [...Array(28)].map((r,i) => i < 10 ? (i + 8) + "" : i < 18 ? "A," + (i - 8) : i < 27 ? (i - 16) + "," + (i - 16) : "A,A"),
		table: [],
		display: "",
		selectedIndex: [ -1, -1 ]
	},
	transactions = [],
	settings = { canSplit: false, canDouble: false, bank: 0, isPlaying: false, currentBet: 0 },
	deck = { cards: [], index: 0 },
	hands = { player: {}, dealer: {}, split: null };

strategy.table = strategy.player.map((player, playerIndex) => [ { value: player }, ...strategy.dealer.map((dealer, dealerIndex) =>
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

		for (let acesIndex = 1; acesIndex <= aces.length; acesIndex++) {
			value = hardTotal + ((aces.length - acesIndex) * 11) + (acesIndex * 1);

			if (value < 21) {
				return value;
			}
		}

		return value;
	}
};

const calculateStrategy = (playerCards, dealerCards, canSplit, canDouble) => {
	const dealerCard = dealerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? 10 : +card.card)[1],
		dealerIndex = strategy.dealer.findIndex(strategy => strategy == dealerCard),
		aces = playerCards.filter(card => card.card === "A").map(card => card.card),
		hardTotal = playerCards.filter(card => card.card !== "A").map(card => isNaN(card.card) ? 10 : +card.card).reduce((total, value) => total + +value, 0);

	let playerIndex = -1,
		display = "";
	
	if (aces.length > 0 && hardTotal + (aces.length * 11) <= 21) {
		// Ace
		const remainingValue = calculateValue(playerCards) - 11;
		playerIndex = strategy.player.findIndex(strategy => strategy == `A,${ remainingValue }`);
	}
	else if (playerCards.length === 2 && playerCards[0].card === playerCards[1].card && canSplit) {
		// Split
		playerIndex = strategy.player.findIndex(strategy => strategy == playerCards.map(card => card.card === "A" ? "A" : isNaN(card.card) ? "10" : card.card).join(","));
	}
	else {
		// Hard Total
		const currentValue = calculateValue(playerCards);
		playerIndex = strategy.player.findIndex(strategy => strategy == currentValue);

		if (playerIndex < 0) {
			display = currentValue < 8 ? "Hit" : "Stand";
		}
	}

	if (dealerIndex >= 0 && playerIndex >= 0) {
		const abbreviation = strategy.table[playerIndex][dealerIndex + 1].value;

		switch (abbreviation) {
			case "H":
				display = "Hit";
				break;
			case "S":
				display = "Stand";
				break;
			case "D":
				display = canDouble ? "Double" : "Hit";
				break;
			case "P":
				display = "Split";
				break;
		}
	}

	strategy.display = display;
	strategy.selectedIndex = [ playerIndex, dealerIndex + 1];
};

export default class {
	
	Transactions = transactions;
	Hands = hands;
	Strategy = strategy;
	Settings = settings;
	Deck = deck;

	constructor(existingTransactions = [], saveState = null, startingBank = 200, defaultBet = 10) {
		strategy.display = "";
		strategy.selectedIndex = [ -1, -1 ];
		transactions.length = 0;
		settings.canSplit = false;
		settings.canDouble = false;

		if (saveState) {
			transactions.push(...saveState.transactions);
			settings.bank = saveState.settings.bank;
			settings.isPlaying = saveState.settings.isPlaying;
			settings.startTime = saveState.settings.startTime;
			settings.currentBet = saveState.settings.currentBet;
			deck.cards = saveState.deck.cards;
			deck.index = saveState.deck.index;
			hands.player = saveState.hands.player;
			hands.dealer = saveState.hands.dealer;
			hands.split = saveState.hands.split;
		}
		else {
			settings.bank = startingBank;
			settings.isPlaying = false;
			settings.startTime = new Date();
			settings.currentBet = defaultBet;
			deck.cards = suits.map(suit => cards.map(card => ({ suit: suit, card: card }))).flatMap(card => card);
			deck.index = 0;
			hands.player = {};
			hands.dealer = {};
			hands.split = null;

			if (existingTransactions.length > 0) {
				transactions.push(...existingTransactions);
				settings.bank = existingTransactions[existingTransactions.length - 1];
			}
			else {
				transactions.push(startingBank);
			}
		}
	};

	Deal = () => {
		const newDeck = deck.cards;

		let currentIndex = newDeck.length,
			temporaryValue,
			randomIndex;
		
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
		
			// And swap it with the current element.
			temporaryValue = newDeck[currentIndex];
			newDeck[currentIndex] = newDeck[randomIndex];
			newDeck[randomIndex] = temporaryValue;
		}

		const playerHand = [ newDeck[0], newDeck[2] ],
			dealerHand = [ newDeck[1], newDeck[3] ],
			playerValue = calculateValue(playerHand),
			dealerValue = calculateValue(dealerHand);

		deck.cards = newDeck;
		deck.index = 4;
		settings.bank = settings.bank - settings.currentBet;
		settings.isPlaying = true;

		hands.player = { cards: playerHand, bet: settings.currentBet, isComplete: false, result: null, value: playerValue };
		hands.dealer = { cards: dealerHand, value: dealerValue };
		hands.split = null;

		settings.canDouble = true;
		settings.canSplit = playerHand[0].card === playerHand[1].card;

		if (hands.player.value !== 21 && hands.dealer.value !== 21) {
			calculateStrategy(hands.player.cards, hands.dealer.cards, settings.canSplit, settings.canDouble);
		}
		else {
			let transaction = 0;

			if (hands.player.value === 21 && hands.dealer.value === 21) {
				hands.player.result = 0;
				transaction = hands.player.bet;
			}
			else if (hands.player.value === 21 && hands.dealer.value !== 21) {
				hands.player.result = 1;
				transaction = hands.player.bet * 2.5;
			}
			else if (hands.player.value !== 21 && hands.dealer.value === 21) {
				hands.player.result = -1;
			}
			
			hands.player.isComplete = true;
			settings.bank += transaction;
			transactions.push(settings.bank);
			settings.isPlaying = false;
		}
	};

	Play = action => {
		if (action === "hit") {
			if (!hands.player.isComplete) {
				hands.player.cards.push(deck.cards[deck.index]);
				deck.index += 1;
				hands.player.value = calculateValue(hands.player.cards);
				hands.player.isComplete = hands.player.value >= 21;
			}
			else if (hands.split) {
				hands.split.cards.push(deck.cards[deck.index]);
				deck.index += 1;
				hands.split.value = calculateValue(hands.split.cards);
				hands.split.isComplete = hands.split.value >= 21;
			}
	
			settings.canDouble = false;
			settings.canSplit = false;
		}
		else if (action === "double") {
			if (!hands.player.isComplete) {
				hands.player.cards.push(deck.cards[deck.index]);
				deck.index += 1;
				hands.player.value = calculateValue(hands.player.cards);
				hands.player.isComplete = true;
				settings.bank -= hands.player.bet;
				hands.player.bet += hands.player.bet;
			}
			else if (hands.split) {
				hands.split.cards.push(deck.cards[deck.index]);
				deck.index += 1;
				hands.split.value = calculateValue(hands.split.cards);
				hands.split.isComplete = true;
				settings.bank -= hands.split.bet;
				hands.split.bet += hands.split.bet;
			}

			settings.canDouble = false;
			settings.canSplit = false;
		}
		else if (action === "stand") {
			if (!hands.player.isComplete) {
				hands.player.isComplete = true;
			}
			else if (hands.split) {
				hands.split.isComplete = true;
			}
	
			settings.canDouble = false;
			settings.canSplit = false;
		}
		else if (action === "split") {
			hands.split = {
				cards: [ hands.player.cards.pop() ],
				bet: hands.player.bet
			};

			settings.bank -= hands.player.bet;
			hands.split.value = calculateValue(hands.split.cards);
			
			hands.player.cards.push(deck.cards[deck.index]);
			deck.index += 1;
			hands.player.value = calculateValue(hands.player.cards);
			hands.player.isComplete = hands.player.value === 21;
			hands.player.isBlackJack = hands.player.value === 21;

			settings.canDouble = hands.player.value !== 21;
			settings.canSplit = false;
		}

		if (hands.player.isComplete && hands.split && !hands.split.isComplete && hands.split.cards.length === 1) {
			// Start the split deck
			hands.split.cards.push(deck.cards[deck.index]);
			deck.index += 1;
			hands.split.value = calculateValue(hands.split.cards);
			hands.split.isComplete = hands.split.value === 21;
			hands.split.isBlackJack = hands.split.value === 21;

			settings.canDouble = hands.split.value !== 21;
			settings.canSplit = false;
		}

		if (hands.player.isComplete && (!hands.split || hands.split.isComplete)) {
			let transaction = 0;
			
			if (hands.player.value <= 21 || (hands.split && hands.split.value <=21)) {
				while (hands.dealer.value < 17 && hands.dealer.value < 21 && hands.dealer.cards.length < 5) {
					hands.dealer.cards.push(deck.cards[deck.index]);
					deck.index += 1;
					hands.dealer.value = calculateValue(hands.dealer.cards);
				}
			}
			
			if (hands.player.isBlackJack && (!hands.dealer.value !== 21 || hands.dealer.cards.length > 2)) {
				transaction += hands.player.bet * 2.5;
				hands.player.result = 1;
			}
			else if (hands.player.value === hands.dealer.value) {
				transaction += hands.player.bet;
				hands.player.result = 0;
			}
			else if (hands.player.value <= 21 && (hands.player.value > hands.dealer.value || hands.dealer.value > 21)) {
				transaction += hands.player.bet * 2;
				hands.player.result = 1;
			}
			else {
				hands.player.result = -1;
			}

			if (hands.split) {
				if (hands.split.isBlackJack && (!hands.dealer.value !== 21 || hands.dealer.cards.length > 2)) {
					transaction += hands.split.bet * 2.5;
					hands.split.result = 1;
				}
				else if (hands.split.value === hands.dealer.value) {
					transaction += hands.split.bet;
					hands.split.result = 0;
				}
				else if (hands.split.value <= 21 && (hands.split.value > hands.dealer.value || hands.dealer.value > 21)) {
					transaction += hands.split.bet * 2;
					hands.split.result = 1;
				}
				else {
					hands.split.result = -1;
				}
			}

			hands.player.isComplete = true;
			settings.bank += transaction;
			transactions.push(settings.bank);
			settings.isPlaying = false;
		}
		else {
			calculateStrategy(hands.player.isComplete ? hands.split.cards : hands.player.cards, hands.dealer.cards, settings.canSplit, settings.canDouble);
		}
	};

}