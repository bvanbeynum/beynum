import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/finance.css";

class Finance extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			toast: { message: "", type: "info" }
		};
	};

	componentDidMount() {
		fetch("/api/financeload")
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
					transactions: data.transactions
				});
				
			})
			.catch(error => {
				console.warn(error);
				this.setState({ isLoading: false, toast: { text: "Error loading data", type: "error" } });
			});
	};

	selectFile = event => {
		if (event.target.files && event.target.files.length === 1) {
			var reader = new FileReader(),
				file = event.target.files[0];

			reader.onload = event => {
				const file = {
					pointer: new Uint8Array(event.target.result),
					pointerIndex: 0,
					fileFormat: ""
				}
				
				if (file.pointer[0] == 0xef && file.pointer[1] == 0xbb && file.pointer[2] == 0xbf) {
					file.fileFormat = "utf8";
					file.pointerIndex = 3;
				}
				else if ((file.pointer[0] == 0xff && file.pointer[1] == 0xfe) || (file.pointer[0] == 0xfe && file.pointer[1] == 0xff)) {
					file.pointer = new Uint16Array(event.target.result);
					file.pointerIndex = 1;
				}

				// Get rows
				const data = [];
				let line = this.getLine(file);
				
				while (line.length > 0 && line.join("").trim().length > 0) {
					data.push(line);
					line = this.getLine(file);
				}

				const upload = data.map(record => ({
					date: new Date(record[0]),
					amount: record[1],
					description: record[4]
				}));
				
				this.setState({ isLoading: true }, () => {
					fetch("/api/uploadtransactions", { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transactions: upload }) })
						.then(response => {
							if (response.ok) {
								return response.json();
							}
							else {
								throw Error(response.statusText);
							}
						})
						.then(data => {
							console.log(data);
							this.setState({ isLoading: false, toast: { text: "Completed", type: "info" } });
						})
						.catch(error => {
							console.warn(error);
							this.setState({ isLoading: false, toast: { text: "Error creating playbook", type: "error" } });
						});
				})
			};

			reader.readAsArrayBuffer(file);
		}
	};

	getLine = (file) => {
		const win1252 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255];
		let codeValue,
			line = [""],
			char,
			isEnclosed = false;
		
		while (file.pointerIndex < file.pointer.length && (isEnclosed || (!isEnclosed && file.pointer[file.pointerIndex] != 10 && file.pointer[file.pointerIndex] != 13))) {
			if (file.fileFormat == "utf8") {
				switch (file.pointer[file.pointerIndex] >> 4) { // shift the bits to check what type of code point (unicode)
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxx xxxx - standard code point regular text
					codeValue = file.pointer[file.pointerIndex];
					break;
				
				case 12: case 13:
					// 110x xxxx  10xx xxxx
					// get active bits, shift them 6 and append the active bits for pos 2
					codeValue = ((file.pointer[file.pointerIndex] & 0x1f) << 6) | (file.pointer[file.pointerIndex + 1] & 0x3f);
					file.pointerIndex += 1;
					break;
				
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					// get pos 1 active bits, shift them 12, append active pos2 bits shifted 6 and append the active bits for pos 3
					codeValue = ((file.pointer[file.pointerIndex] & 0x0f) << 12) | ((file.pointer[file.pointerIndex + 1] & 0x3f) << 6) | (file.pointer[file.pointerIndex + 2] & 0x3f);
				}
				
				char = codeValue;
			}
			else {
				char = win1252[file.pointer[file.pointerIndex]];
			}
			
			if (line[line.length - 1].length == 0 && char != 44 && !isEnclosed) {
				// New line, not additional delimiter
				if (line.length == 0 && char == 34) {
					// New line and char is enclosing char
					isEnclosed = true;
				}
				else {
					// Add char to the line
					line[line.length - 1] += String.fromCharCode(char);
				}
			}
			else if (char == 44 && !isEnclosed) {
				// Delimiter and not enclosed
				if (file.pointer[file.pointerIndex + 1] == 34 && !isEnclosed) {
					// Next value is an enclosing char
					isEnclosed = true;
					file.pointerIndex += 1;
				}
				
				// Add a new empty string to the array that will be populated next
				line.push("");
			}
			else if (char == 34 && isEnclosed) {
				// Is this the ending of the enclosing section
				if (file.pointer[file.pointerIndex + 1] == 34) {
					// If the double quote is escaped with another double quote
					line[line.length - 1] += String.fromCharCode(char); // Add the double quote
					file.pointerIndex += 1; // bypass the next double quote and leave as enclosed
				}
				else {
					// Encountered ending enclosing char
					isEnclosed = false;
				}
			}
			else {
				line[line.length - 1] += String.fromCharCode(char);
			}
			
			file.pointerIndex++;
		}
		
		// Increment past the line ending
		file.pointerIndex += 1;
		
		if (file.pointerIndex < file.pointer.length && (file.pointer[file.pointerIndex] == 10 || file.pointer[file.pointerIndex] == 13)) {
			// There is a line break or carridge return after the previous char
			file.pointerIndex += 1;
		}
		
		return line;
	};

	render() { return (
		<div className="pageContainer">
			
		{
		this.state.isLoading ?
			<div className="loading">
				<img alt="Loading" src="/media/loading.gif" />
			</div>
		:
			<>
			<div className="content">
			</div>

			<div className="bottomNav">
				<div className="button">
					<label htmlFor="fileSelector">
						{/* Upload File */}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h4v-2H5V8h14v10h-4v2h4c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm-7 6l-4 4h3v6h2v-6h3l-4-4z"></path></svg>
					</label>
				</div>

				<input id="fileSelector" type="file" accept=".csv, text/comma-separated-values" onChange={ this.selectFile } onClick={ event => { event.target.value = null }} />
			</div>
			</>
		}

			<Toast message={ this.state.toast } />
		</div>
	); }
}

ReactDOM.render(<Finance />, document.getElementById("root"));
