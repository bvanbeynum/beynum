import React, { useEffect, useState } from "react";

const BarChart = props => {

	const seriesColors = ["#2CBF4B", "#2CBFAF", "#2CBF7D", "#43BF2C", "#2CA0BF" ];

	const [ chartSettings, setChartSettings ] = useState(null);
	
	useEffect(() => {
		if (props.data) {
			const settings = {
				width: 250,
				height: 100,
				chartHeight: 65,
				chartY: 25,
				show0: props.data.flatMap(series => series.points).some(point => point < 0)
			};

			const labelWidth = settings.width / 3,
				labelPadding = 5,
				statData = [].concat(props.data.filter(series => series.showStats).map(series => series.points).find(() => true)).sort((pointA, pointB) => pointA - pointB);

			settings.stats = {
				min: {
					x: labelPadding,
					value: [].concat(statData).shift().toLocaleString()
				},
				max: {
					x: settings.width - (labelPadding * 2),
					value: [].concat(statData).pop().toLocaleString()
				},
				percent80: {
					x: labelWidth + (labelWidth / 2),
					value: [].concat(statData).slice(0, Math.floor(statData.length * .8) + 1).pop().toLocaleString()
				}
			};

			const totalPoints = [].concat(props.data.map(series => series.points.length)).sort((seriesA, seriesB) => seriesA - seriesB).pop(),
				tickWidth = settings.width / totalPoints,
				barWidth = Math.ceil(tickWidth / (props.data.length + 2)),
				valueMax = props.data.flatMap(series => series.points)
					.reduce((total, value) => total > value ? total : value , 0),
				valueMin = props.data.flatMap(series => series.points)
					.reduce((total, value) => total < value ? total : value , valueMax),
				valueDifference = valueMax - valueMin;
			
			const labelsMax = Math.min(totalPoints, 8);

			settings.series = props.data
				.map((series, seriesIndex) => ({
					color: seriesColors[seriesIndex],
					isDashed: series.isDashed,
					points: series.points.map((point, pointIndex) => ({
						x: (tickWidth * pointIndex) + (tickWidth / 2),
						y: settings.chartHeight - (((point - valueMin) * settings.chartHeight) / valueDifference),
						width: barWidth,
						label: series.showLabels && pointIndex > 0 && pointIndex % Math.floor((totalPoints - 2) / labelsMax) == 0 ?
							point.toLocaleString()
							: null,
						value: point.toLocaleString()
					}))
				}));
			
			settings.baseline = valueMin < 0 ? settings.chartHeight - (((0 - valueMin) * settings.chartHeight) / valueDifference) : null;

			setChartSettings(settings);
		}
	}, [props.data]);

	return (

<div className="chart barChart">
{
chartSettings ?

	<svg viewBox={`0 0 ${ chartSettings.width } ${ chartSettings.height }`}>
		<g transform={ `translate(0, ${ chartSettings.chartY })` }>
			{
			chartSettings.baseline ?
			<line x1="0" y1={ chartSettings.baseline } x2={ chartSettings.width } y2={ chartSettings.baseline } className="baseline" />
			: ""
			}

			{
			chartSettings.series.map((series, seriesIndex) =>
				series.points.map((point, pointIndex) =>
					<rect key={ (seriesIndex + 1) * pointIndex } x={ point.x + (seriesIndex * point.width) } y={ point.y } width={ point.width } height={ chartSettings.chartHeight - point.y } fill={ series.color }></rect>
				)
			)
			}

			{
			chartSettings.series.map((series, seriesIndex) =>
				series.points.filter(point => point.label).map((point, pointIndex) => 
					<text className="dataLabel" key={(seriesIndex + 1) * pointIndex} x={ point.x } y={ point.y - 3 } textAnchor="middle" alignmentBaseline="baseline">{ point.value }</text>
				)
			)
			}
		</g>

		<text className="statlabel" x={ chartSettings.stats.min.x } y="2" textAnchor="start" alignmentBaseline="hanging">min: { chartSettings.stats.min.value }</text>
		<text className="statlabel" x={ chartSettings.stats.percent80.x } y="2" textAnchor="middle" alignmentBaseline="hanging">80th: { chartSettings.stats.percent80.value }</text>
		<text className="statlabel" x={ chartSettings.stats.max.x } y="2" textAnchor="end" alignmentBaseline="hanging">max: { chartSettings.stats.max.value }</text>
	</svg>

: ""
}
</div>

	)
};
	
export default BarChart;
