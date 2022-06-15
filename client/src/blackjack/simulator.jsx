import React from "react";

const Simulator = props => {
	return (
		<div className="content">

			<div className="simulatorScreen">
				<div className="simulatorHeader">
					<div>
						ratio:&nbsp;
						{ (props.transactions.filter(transaction => transaction.resultDisplay).filter((trans, transIndex, transArray) => (transIndex === transArray.length - 1 ? 200 : transArray[transIndex + 1].bank) < trans.bank).length / (props.transactions.filter(transaction => transaction.resultDisplay).filter((trans, transIndex, transArray) => (transIndex === transArray.length - 1 ? 200 : transArray[transIndex + 1].bank) > trans.bank).length || 0)).toFixed(2) }
						&nbsp;(
						{ props.transactions.filter(transaction => transaction.resultDisplay).filter((trans, transIndex, transArray) => (transIndex === transArray.length - 1 ? 200 : transArray[transIndex + 1].bank) < trans.bank).length }
						&nbsp;/&nbsp;
						{ props.transactions.filter(transaction => transaction.resultDisplay).filter((trans, transIndex, transArray) => (transIndex === transArray.length - 1 ? 200 : transArray[transIndex + 1].bank) > trans.bank).length }
						)
					</div>

					<div>
						min / max:&nbsp;
						{ `${ Math.min(...props.transactions.filter(transaction => transaction.resultDisplay).map(transaction => transaction.bank)) } / ${ Math.max(...props.transactions.filter(transaction => transaction.resultDisplay).map(transaction => transaction.bank)) }` }
					</div>
				</div>

				<table className="simulatorLog">
				<thead>
				<tr>
					<th>Hand</th>
					<th>Dealer</th>
					<th>Player</th>
					<th>Split</th>
					<th>Suggestion / Result</th>
				</tr>
				</thead>
				<tbody>
				{
				props.transactions.map((transaction, transactionIndex) =>
					<tr key={ transactionIndex } className={ `${ transaction.resultDisplay || "" } ${ transaction.resultDisplay ? "complete" : "" }` }>
						<td>{ transaction.hand }</td>
						<td>{ transaction.dealer }</td>
						<td>{ transaction.player }</td>
						<td>{ transaction.split }</td>
						<td>
						{
						transaction.resultDisplay ?
							<>
							<div>{ transaction.result }</div>
							<div>{ transaction.bank }</div>
							</>
						: transaction.result
						}
						</td>
					</tr>
				)
				}
				</tbody>
				</table>
			</div>

			<div className="floatingButton" onClick={ props.setState }>
				{
				props.isRunning ?
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M26.25 38V10H38V38ZM10 38V10H21.75V38Z"/></svg>
				:
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M16 37.85V9.85L38 23.85Z"/></svg>
				}
			</div>

		</div>
	)
}

export default Simulator;
