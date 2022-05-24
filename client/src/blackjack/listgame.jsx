import React from "react";

const ListGame = props => {
	return (
		<div className="listItem">
			<div className="listHeader">
				<div>
					{ props.end } / { props.hands.length } hands / ${ props.bank }
				</div>

				<div>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onClick={ () => props.deleteGame(props.gameId) }><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
				</div>
			</div>

			<div className="listGraph" onClick={ () => { if (props.bank >= 10) { props.selectGame(props.gameId) }}}>
				<svg viewBox="-5 -5 400 60" className="statLine horizontal" preserveAspectRatio="xMidYMin">
					<line x1="0" x2="400" y1="25" y2="25" />
					<path d={ `M${ props.statLine[0].x } ${ props.statLine[0].y } ${ props.statLine.slice(1).map(point => `L${ point.x } ${ point.y }`).join(" ") }` } />
					{
					props.statLine.map((point, pointIndex) => 
						<circle key={ pointIndex } cx={ point.x } cy={ point.y } r="2" fill={ point.color } />
					)
					}
				</svg>
			</div>
		</div>
	)
}

export default ListGame;