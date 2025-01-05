import React, { useEffect, useState, useCallback, useRef } from "react";

const HistogramChart = props => {

	const seriesColors = ["#2CBF4B", "#2CBFAF", "#2CBF7D", "#43BF2C", "#2CA0BF" ],
		labelPadding = 5;

	const axisBarRef = useRef(0);

	const [ chartSettings, setChartSettings ] = useState(null);
	
	useEffect(() => {
		if (props.data) {

			const settings = {
				width: 250,
				height: 15 * props.data.length + (labelPadding * 2),
				chartHeight: 15 * props.data.length,
				chartY: labelPadding,
				itemHeight: 15,
				axisBarX: axisBarRef.current
			};

			settings.items = props.data
				.sort((itemA, itemB) => (itemB.value * -1) - (itemA.value * -1))
				.map((item, itemIndex) => ({
					name: item.name,
					color: seriesColors[0],
					x: labelPadding,
					y: itemIndex * settings.itemHeight,
					width: 0,
					height: settings.itemHeight / 2,
					value: (item.value * -1).toFixed(2).toLocaleString()
				}))

			setChartSettings(settings);
		}
	}, [props.data]);

	const textElementRef = useCallback(element => {
		if (element !== null) {
			const elementWidth = element.getBBox().width;

			if (elementWidth > axisBarRef.current) {
				axisBarRef.current = elementWidth;

				setChartSettings(chartSettings => ({
					...chartSettings,
					axisBarX: elementWidth + (labelPadding * 2)
				}));
			}
		}
	}, []);

	useEffect(() => {
		if (chartSettings?.axisBarX > 0 && !chartSettings.items.some(item => item.width > 0)) {
			const valueMax = chartSettings.items.reduce((total, item) => total > item.value ? total : item.value, 0);
			
			const itemsUpdate = chartSettings.items.map(item => ({
				...item,
				width: item.value > 0 ? (item.value * (chartSettings.width - chartSettings.axisBarX - 5)) / valueMax : 0,
			}));

			setChartSettings(chartSettings => ({
				...chartSettings,
				items: itemsUpdate
			}));
		}
	}, [chartSettings]);

	return (

<div className="chart barChart">
{
chartSettings ?

	<svg viewBox={`0 0 ${ chartSettings.width } ${ chartSettings.height }`}>
		<g transform={ `translate(0, ${ chartSettings.chartY })` }>
		{
			chartSettings.items.map((item, itemIndex) =>
			
			<text key={itemIndex} className="dataLabel" x={ item.x } y={ item.y } alignmentBaseline="hanging" ref={ textElementRef }>{ item.name }</text>
			
			)
		}

		{
			chartSettings.items.map((item, itemIndex) => 
			
			<rect key={itemIndex} className="dataBar" x={ chartSettings.axisBarX } y={ item.y } width={ item.width } height={ item.height } fill={ item.color } />

			)
		}

		{
			chartSettings.items.map((item, itemIndex) =>
			
			<text key={itemIndex} className="dataLabel" x={ chartSettings.width - item.x } y={ item.y + (item.height / 2) } textAnchor="end" alignmentBaseline="middle">{item.value}</text>

			)
		}

			<line x1={ chartSettings.axisBarX } y1="0" x2={ chartSettings.axisBarX } y2={ chartSettings.chartHeight } className="baseline" />
		</g>

	</svg>

: ""
}
</div>

	)
};
	
export default HistogramChart;
