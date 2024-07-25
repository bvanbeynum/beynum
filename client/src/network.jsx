import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import Toast from "./toast.jsx";

const Network = () => {

	const css = {
		page: {
			fill: "red",
			stroke: "blue",
			strokeWidth: "1px"
		}
	};

	const svgRef = useRef();
	const [ relationships, setRelationships ] = useState([]);
	const [ isLoaded, setIsLoaded ] = useState(false);

	useEffect(() => {
		if (!isLoaded && svgRef.current) {

			// const relationships = [
			// 	{ source: "A", target: "B" },
			// 	{ source: "B", target: "C" }
			// ];

			const data = [
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 94068 , name: "Luke Hudson" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 99694 , name: "Paul Williams" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 94327 , name: "Ryker Ashford" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 80667 , name: "Sullivan Silbiger" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 1630 , name: "Zander Brewer" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 93266 , name: "Nate Manos" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 81084 , name: "Luke Hillers" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 102911 , name: "Adam Hardeman" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 869 , name: "Aiden Johnson" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 101906 , name: "Evan Gates" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 43673 , name: "Jace Randolph" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 104744 , name: "Jessiah Rockeymore" } },
				{ source: { id: 8145, name: "Lucas Van Beynum"}, target: { id: 104194 , name: "Andreo Manlove" } },
				{ source: { id: 104194, name: "Andreo Manlove"}, target: { id: 80981 , name: "Jack Turner" } },
				{ source: { id: 104194, name: "Andreo Manlove"}, target: { id: 104193 , name: "Landon Phillips" } },
				{ source: { id: 104194, name: "Andreo Manlove"}, target: { id: 104195 , name: "Jaylen Phillips" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 7664 , name: "Peyton Gillespie" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 7932 , name: "Evan Sibert" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 43673 , name: "Jace Randolph" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 94040 , name: "Beckham Boggess" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 2993 , name: "Wyatt Cassels" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 104745 , name: "Isaac Rosenthal" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 7974 , name: "Morrison Murphy" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 81133 , name: "Kamron Fincher" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 81442 , name: "Dillan Boyer" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 7959 , name: "Liam Dayton" } },
				{ source: { id: 104744, name: "Jessiah Rockeymore"}, target: { id: 7652 , name: "Bryson Hipps" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 99694 , name: "Paul Williams" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 99345 , name: "Luke Bauer" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 56632 , name: "Joseph Britt" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 101021 , name: "Brandon Bowers" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 99343 , name: "Brandt Young" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 81084 , name: "Luke Hillers" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 99342 , name: "Ethan Adams" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 93266 , name: "Nate Manos" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 1630 , name: "Zander Brewer" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 94327 , name: "Ryker Ashford" } },
				{ source: { id: 21913, name: "Dane Dillon"}, target: { id: 727 , name: "Jackson Stocker" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 25334 , name: "Drew Timmerman" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 3004 , name: "Cj Williams" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 94068 , name: "Luke Hudson" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 8148 , name: "Jadon Shannon" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 81084 , name: "Luke Hillers" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 3019 , name: "Ryan Mcgrail" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 104744 , name: "Jessiah Rockeymore" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 99330 , name: "Jahiem Skyers" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 106600 , name: "Dylan Sneed" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 94335 , name: "Hashimi Cole" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 25336 , name: "Jacob Lutz" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 6470 , name: "Kale Burgess" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 56632 , name: "Joseph Britt" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 102375 , name: "Jd Cleapor" } },
				{ source: { id: 43673, name: "Jace Randolph"}, target: { id: 101903 , name: "Brycen Colvin" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 80667 , name: "Sullivan Silbiger" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 104196 , name: "Aiden Simmons" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 101908 , name: "Derrick Isaac" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 30649 , name: "Jantzen Huneycutt" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 25336 , name: "Jacob Lutz" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 80663 , name: "Caeden Carr" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 80981 , name: "Jack Turner" } },
				{ source: { id: 101906, name: "Evan Gates"}, target: { id: 1634 , name: "Ryan Felkel" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 3019 , name: "Ryan Mcgrail" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 99514 , name: "Jake Porter" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 28675 , name: "Jesus Molina" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 3009 , name: "Jackson Mclees" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 99515 , name: "Logan Black" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 3077 , name: "Matthew Groh" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 3031 , name: "Jalan Esquivel" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 99518 , name: "Carson Mclane" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 28430 , name: "Camden Metz" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 99505 , name: "Andrew Zumbach" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 99517 , name: "Jason Holder" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 4606 , name: "Lincoln Collins" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 81085 , name: "Calvin Cook" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 98428 , name: "Ian Callon" } },
				{ source: { id: 869, name: "Aiden Johnson"}, target: { id: 81215 , name: "Harrison Knight" } },
				{ source: { id: 102911, name: "Adam Hardeman"}, target: { id: 94068 , name: "Luke Hudson" } },
				{ source: { id: 102911, name: "Adam Hardeman"}, target: { id: 80663 , name: "Caeden Carr" } },
				{ source: { id: 102911, name: "Adam Hardeman"}, target: { id: 30649 , name: "Jantzen Huneycutt" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 726 , name: "Rolland Boisvert" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 30649 , name: "Jantzen Huneycutt" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 43673 , name: "Jace Randolph" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 3012 , name: "Jake Kimbrell" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 99352 , name: "Christian Hickson" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 99351 , name: "Noah Eller" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 100422 , name: "Zane Garcia" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 99343 , name: "Brandt Young" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 81142 , name: "Lucas Bedenbaugh" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 3004 , name: "Cj Williams" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 99348 , name: "Rahiem Skyers" } },
				{ source: { id: 81084, name: "Luke Hillers"}, target: { id: 94068 , name: "Luke Hudson" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 99695 , name: "Paul Herron" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 3004 , name: "Cj Williams" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 81215 , name: "Harrison Knight" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 101903 , name: "Brycen Colvin" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 99694 , name: "Paul Williams" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 98428 , name: "Ian Callon" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 1630 , name: "Zander Brewer" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 99335 , name: "Brice Cannon" } },
				{ source: { id: 93266, name: "Nate Manos"}, target: { id: 94327 , name: "Ryker Ashford" } },
				{ source: { id: 1630, name: "Zander Brewer"}, target: { id: 93266 , name: "Nate Manos" } },
				{ source: { id: 1630, name: "Zander Brewer"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 1630, name: "Zander Brewer"}, target: { id: 99695 , name: "Paul Herron" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 727 , name: "Jackson Stocker" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 101907 , name: "Kannon Sample" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 101906 , name: "Evan Gates" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 104196 , name: "Aiden Simmons" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 101908 , name: "Derrick Isaac" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 101905 , name: "Eli Lorang" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 102085 , name: "Oscar Roman" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 99348 , name: "Rahiem Skyers" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 56632 , name: "Joseph Britt" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 81006 , name: "Charles Judy" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 94068 , name: "Luke Hudson" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 102920 , name: "Brock Watson" } },
				{ source: { id: 80667, name: "Sullivan Silbiger"}, target: { id: 1634 , name: "Ryan Felkel" } },
				{ source: { id: 94327, name: "Ryker Ashford"}, target: { id: 99694 , name: "Paul Williams" } },
				{ source: { id: 94327, name: "Ryker Ashford"}, target: { id: 106184 , name: "Ryker Ashford" } },
				{ source: { id: 94327, name: "Ryker Ashford"}, target: { id: 99695 , name: "Paul Herron" } },
				{ source: { id: 94327, name: "Ryker Ashford"}, target: { id: 93266 , name: "Nate Manos" } },
				{ source: { id: 94327, name: "Ryker Ashford"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 99694, name: "Paul Williams"}, target: { id: 21913 , name: "Dane Dillon" } },
				{ source: { id: 99694, name: "Paul Williams"}, target: { id: 99695 , name: "Paul Herron" } },
				{ source: { id: 99694, name: "Paul Williams"}, target: { id: 94327 , name: "Ryker Ashford" } },
				{ source: { id: 99694, name: "Paul Williams"}, target: { id: 93266 , name: "Nate Manos" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 3019 , name: "Ryan Mcgrail" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 102911 , name: "Adam Hardeman" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 100576 , name: "Christly Martin" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 5251 , name: "Skyler Lollis" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 80981 , name: "Jack Turner" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 43673 , name: "Jace Randolph" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 94040 , name: "Beckham Boggess" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 2988 , name: "Nathan Hickey" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 102918 , name: "Layne Summers" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 30649 , name: "Jantzen Huneycutt" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 101970 , name: "Ryan Seman" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 872 , name: "Micah Hall" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 7652 , name: "Bryson Hipps" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 81085 , name: "Calvin Cook" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 25334 , name: "Drew Timmerman" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 80667 , name: "Sullivan Silbiger" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 81084 , name: "Luke Hillers" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 81442 , name: "Dillan Boyer" } },
				{ source: { id: 94068, name: "Luke Hudson"}, target: { id: 81133 , name: "Kamron Fincher" } }
			];

			const relationships = data.map(record => ({ source: record.source.id, target: record.target.id }));

			const svg = d3.select(svgRef.current)
				.append("svg")
				.attr("width", 600)
				.attr("height", 800);
			
			const links = svg.selectAll("line")
				.data(relationships)
				.enter()
				.append("line");
			
			const nodes = [...new Set(relationships.flatMap(relationship => [ relationship.source, relationship.target ] ))]
				.map(relationshipId => 
					data.filter(relationship => relationship.source.id == relationshipId || relationship.target.id == relationshipId)
						.map(relationship => relationship.source.id == relationshipId ? relationship.source : relationship.target)
						.find(() => true)
				);

			const circles = svg.selectAll("circle")
				.data(nodes)
				.enter()
				.append("circle")
				.attr("r", 5);
			
			circles.append("title")
				.text(d => d.name);
			
			const simulation = d3.forceSimulation(nodes)
				.force("link", d3.forceLink(relationships).id(d => d.id))
				.force("charge", d3.forceManyBody().strength(-50))
				.force("center", d3.forceCenter(300, 400));
			
			simulation.on("tick", () => {
				links.attr("x1", d => d.source.x)
					.attr("y1", d => d.source.y)
					.attr("x2", d => d.target.x)
					.attr("y2", d => d.target.y);
				
				circles.attr("cx", d => d.x)
					.attr("cy", d => d.y);
			});

		}
	}, []);

	return (
		<div style={ css.page } ref={ svgRef }></div>
	);

};

ReactDOM.render(<Network />, document.getElementById("root"));
export default Network;
