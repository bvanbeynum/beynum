import React, { useState } from "react";

const Game = (props) => {

	return (
		
	<div className="content">

		<div className="topNav">
			<div className="gameStat">{ props.engine.Transactions ? props.engine.Transactions.length : 0 }</div>
			<div className="gameLabel">#</div>
			<div className="gameStat">{ props.engine.Settings.bank }</div>
			<div className="gameLabel">$</div>
			<div className="gameAction" onClick={ () => { props.changeBet(-10) }}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 12.5h9v-1h-9ZM12 21q-1.875 0-3.512-.712-1.638-.713-2.85-1.926-1.213-1.212-1.926-2.85Q3 13.875 3 12t.712-3.513q.713-1.637 1.926-2.85 1.212-1.212 2.85-1.925Q10.125 3 12 3t3.513.712q1.637.713 2.85 1.925 1.212 1.213 1.925 2.85Q21 10.125 21 12t-.712 3.512q-.713 1.638-1.925 2.85-1.213 1.213-2.85 1.926Q13.875 21 12 21Zm0-1q3.35 0 5.675-2.325Q20 15.35 20 12q0-3.35-2.325-5.675Q15.35 4 12 4 8.65 4 6.325 6.325 4 8.65 4 12q0 3.35 2.325 5.675Q8.65 20 12 20Zm0-8Z"/></svg>
			</div>
			<div className="gameStat bet">{ props.engine.Settings.currentBet }</div>
			<div className="gameAction" onClick={ () => { props.changeBet(10) }}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 16.5h1v-4h4v-1h-4v-4h-1v4h-4v1h4ZM12 21q-1.875 0-3.512-.712-1.638-.713-2.85-1.926-1.213-1.212-1.926-2.85Q3 13.875 3 12t.712-3.513q.713-1.637 1.926-2.85 1.212-1.212 2.85-1.925Q10.125 3 12 3t3.513.712q1.637.713 2.85 1.925 1.212 1.213 1.925 2.85Q21 10.125 21 12t-.712 3.512q-.713 1.638-1.925 2.85-1.213 1.213-2.85 1.926Q13.875 21 12 21Zm0-1q3.35 0 5.675-2.325Q20 15.35 20 12q0-3.35-2.325-5.675Q15.35 4 12 4 8.65 4 6.325 6.325 4 8.65 4 12q0 3.35 2.325 5.675Q8.65 20 12 20Zm0-8Z"/></svg>
			</div>
			<div className="gameLabel">$</div>
			<div className="gameStat strategyDisplay">{ props.engine.Strategy.display }</div>
		</div>

		<div className="gameContent">
			<div className="rowContainer">

				<table className="strategy">
				<thead>
				<tr>
					<th></th>
				{
				props.engine.Strategy.dealer.map((column, columnIndex) =>
					<th key={ columnIndex }>{ column }</th>
				)
				}
				</tr>
				</thead>
				<tbody>
				{
				props.engine.Strategy.table.map((row, rowIndex) =>
				<tr key={ rowIndex }>
					{
					row.map((column, columnIndex) =>
						<td key={ columnIndex } className={ `${ column.value } ${ rowIndex === props.engine.Strategy.selectedIndex[0] && columnIndex === props.engine.Strategy.selectedIndex[1] ? "highlight" : "" }` }>{ column.value }</td>
					)
					}
				</tr>
				)
				}
				</tbody>
				</table>

				<div className="transactionBoard">
					<div className="transactionHeader">
						<div>
						{ props.engine.Transactions.filter((trans, transIndex, transArray) => transIndex < transArray.length - 1 && transArray[transIndex + 1] > trans).length }
						/
						{ props.engine.Transactions.filter((trans, transIndex, transArray) => transIndex < transArray.length - 1 && transArray[transIndex + 1] < trans).length }
						</div>

						<div>
						{ (props.engine.Transactions.filter((trans, transIndex, transArray) => transIndex < transArray.length - 1 && transArray[transIndex + 1] > trans).length / (props.engine.Transactions.filter((trans, transIndex, transArray) => transIndex < transArray.length - 1 && transArray[transIndex + 1] < trans).length || 0)).toFixed(2) }
						</div>

						<div>
							{ `${ Math.min(...props.engine.Transactions) } / ${ Math.max(...props.engine.Transactions) }` }
						</div>
					</div>

					{
					props.engine.Transactions
					.reduceRight((array, value) => array.concat(value), [])
					.map((trans, transIndex, transArray) => 
					<div key={ transIndex } className={ `transactionValue ${ transIndex === transArray.length - 1 || transArray[transIndex + 1] === trans ? "push" : transArray[transIndex + 1] < trans ? "win" : "loss" }` }>
						{ trans }
					</div>
					)
					}
				</div>

			</div>
		
			<div className="rowContainer">
				
				<div className="actionContainer">
					<div className={ `button ${ !props.engine.Settings.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(118 191 134)', borderColor: 'rgb(46 124 46)' }} onClick={ () => { if (props.engine.Settings.isPlaying) { props.play("hit") }} }>Hit</div>
					<div className={ `button ${ !props.engine.Settings.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(197 67 66)', borderColor: 'rgb(116 50 50)' }} onClick={ () => { if (props.engine.Settings.isPlaying) { props.play("stand") }} }>Stand</div>
					<div className={ `button ${ !props.engine.Settings.isPlaying || !props.engine.Settings.canDouble ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (props.engine.Settings.isPlaying && props.engine.Settings.canDouble) { props.play("double") }} }>Double</div>
					<div className={ `button ${ !props.engine.Settings.isPlaying || !props.engine.Settings.canSplit ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(226 195 106)', borderColor: 'rgb(157 132 59)' }} onClick={ () => { if (props.engine.Settings.isPlaying && props.engine.Settings.canSplit) { props.play("split") }} }>Split</div>
					<div className={ `button ${ props.engine.Settings.isPlaying ? "inactive" : "" }` } style={{ backgroundColor: 'rgb(91 177 197)', borderColor: 'rgb(57 131 143)' }} onClick={ () => { if (!props.engine.Settings.isPlaying) { props.play("deal") }} }>Deal</div>
				</div>
				
				<div className="cardsContainer">
					<div className="handContainer">

					{
					!props.engine.Settings.isPlaying && props.engine.Hands.dealer.cards ?
						<div className="result">
							{ props.engine.Hands.dealer.value + " " }
							{ 
							 props.engine.Hands.player.result === -1 && (!props.engine.Hands.split || (props.engine.Hands.split.result === -1)) ? "Win"
								: props.engine.Hands.player.result === 1 || (props.engine.Hands.split && props.engine.Hands.split.result === 1) ? "Lose"
								: props.engine.Hands.player.result === 0 ? "Push"
								: ""
							}
						</div>
					: ""
					}

					{
					props.engine.Hands.dealer.cards ?
					props.engine.Hands.dealer.cards.map((card, cardIndex) =>
						<div className={ `card ${ (cardIndex > 0 || !props.engine.Settings.isPlaying) && (card.suit === "♥" || card.suit === "♦") ? "cardRed" : "" }` } key={ cardIndex }>
							<div className="cardText">{ cardIndex > 0 || !props.engine.Settings.isPlaying ? card.card : "?" }</div>
							<div className="cardText">{ cardIndex > 0 || !props.engine.Settings.isPlaying ? card.suit : "" }</div>
							<div className="cardText">{ cardIndex > 0 || !props.engine.Settings.isPlaying ? card.suit : "" }</div>
							<div className="cardText">{ cardIndex > 0 || !props.engine.Settings.isPlaying ? card.card : "?" }</div>
						</div>
					)
					: ""
					}

					</div>
					
					<div className="handContainer">
					{
					!props.engine.Settings.isPlaying && props.engine.Hands.player.cards ?
						<div className="result">
						{ props.engine.Hands.player.value + " " }
						{ 
						props.engine.Hands.player.result === 1 ? "Win" 
							: props.engine.Hands.player.result === -1 ? "Lose"
							: props.engine.Hands.player.result === 0 ? "Push"
							: ""
						}
						</div>
					: ""
					}
					{
					props.engine.Hands.player.cards ? 
					props.engine.Hands.player.cards.map((card, cardIndex) => 
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
					props.engine.Hands.split ?
						<div className="handContainer">
						{
						!props.engine.Settings.isPlaying ?
							<div className="result">
							{ props.engine.Hands.split.value + " " }
							{ 
							props.engine.Hands.split.result === 1 ? "Win"
								: props.engine.Hands.split.result === -1 ? "Lose"
								: props.engine.Hands.split.result === 0 ? "Push"
								: ""
							}
							</div>
						: ""
						}
						{
						props.engine.Hands.split.cards.map((card, cardIndex) => 
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
