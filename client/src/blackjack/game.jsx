import React, { useState } from "react";

const Game = (props) => {

	return (
		
	<div className="content">

		<div className="topNav">
			<div className="gameStat">{ props.engine.Transactions ? props.engine.Transactions.length : 0 }</div>
			<div className="gameLabel">#</div>
			<div className="gameStat">{ props.engine.Settings.bank }</div>
			<div className="gameLabel">$</div>
			<div className="gameStat">{ props.engine.Settings.currentBet }</div>
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
							{ props.engine.Hands.dealer.value + " " }
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
