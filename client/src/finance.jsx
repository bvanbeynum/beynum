import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./finance/finance.css";
import Toast from "./toast.jsx";
import LineChart from "./finance/linechart.jsx";
import BarChart from "./finance/barchart.jsx";
import HistogramChart from "./finance/histogramchart.jsx";

const Finance = () => {

	const destinationFields = [
		{ field: "transactionDate", display: "Transaction Date", isDate: true },
		{ field: "description", display: "Description" },
		{ field: "amount", display: "Amount" }
	];

	const [ page, setPage ] = useState("");
	const [ isMenuOpen, setIsMenuOpen ] = useState(false);

	const [ chartData, setChartData ] = useState({});

	const [ transactionPage, setTransactionPage ] = useState(1);
	const [ transactionSearch, setTransactionSearch ] = useState("");
	const [ transactions, setTransactions ] = useState(null);
	const [ filterCategory, setFilterCategory ] = useState("");
	const [ transactionCategories, setTransactionCategories ] = useState([]);
	const [ newCategoryId, setNewCategoryId ] = useState(null);
	const [ newCategoryInput, setNewCategoryInput ] = useState("");
	const [ onlyUncategorized, setOnlyUncategorized ] = useState(false);
	const [ dataCards, setDataCards ] = useState({});

	const [ selectedSource, setSelectedSource ] = useState("");
	const [ dataSources, setDataSources ] = useState([]);
	const [ showNewSource, setShowNewSource ] = useState(false);
	const [ fileSource, setFileSource ] = useState("");
	const [ fileData, setFileData ] = useState(null);
	const [ mappings, setMappings ] = useState([]);
	const [ hasHeader, setHasHeader ] = useState(false);
	const [ toastMessage, setToastMessage ] = useState({ message: "", type: "info" });

	useEffect(() => {
		if (!transactions) {
			
			fetch(`/finance/api/load`)
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					const transactions = data.transactions.map(transaction => ({
							...transaction, 
							descriptionDisplay: transaction.descriptionOverride || transaction.description,
							transactionDate: new Date(transaction.transactionDate) 
						}));
					
					const lastMonth = new Date();
					lastMonth.setDate(0);

					const thisMonth = new Date();
					thisMonth.setMonth(thisMonth.getMonth() + 1);
					thisMonth.setDate(0);

					const transactionsMonthNow = transactions.filter(transaction => transaction.transactionDate.getFullYear() == thisMonth.getFullYear() && transaction.transactionDate.getMonth() == thisMonth.getMonth()),
						transactionsMonthLast = transactions.filter(transaction => transaction.transactionDate.getFullYear() == lastMonth.getFullYear() && transaction.transactionDate.getMonth() == lastMonth.getMonth()),
						dailyNow = Array.from(Array(thisMonth.getDate()).keys())
							.filter(date => date + 1 < new Date().getDate())
							.map(date => transactionsMonthNow
								.filter(transaction => transaction.transactionDate.getDate() == (date + 1))
								.reduce((total, transaction) => total + +transaction.amount.toFixed(2) , 0)
							)
							.reduce((days, amount) => {
								days.push((days.length && days[days.length - 1] || 0) + amount);
								return days;
							}, []), // Running total
						dailyLast = Array.from(Array(lastMonth.getDate()).keys())
							.map(date => transactionsMonthLast
								.filter(transaction => transaction.transactionDate.getDate() == (date + 1))
								.reduce((total, transaction) => total + +transaction.amount.toFixed(2), 0)
							)
							.reduce((days, amount) => {
								days.push((days.length && days[days.length - 1] || 0) + amount);
								return days;
							}, []); // Running total
					
					const dailySpendingNow = Array.from(Array(thisMonth.getDate()).keys())
							.filter(date => date + 1 < new Date().getDate())
							.map(date => transactionsMonthNow
								.filter(transaction => transaction.transactionDate.getDate() == (date + 1) && transaction.amount < 0)
								.reduce((total, transaction) => total + Math.abs(+transaction.amount.toFixed(2)), 0)
							),
						dailySpendingLast = Array.from(Array(lastMonth.getDate()).keys())
							.map(date => transactionsMonthLast
								.filter(transaction => transaction.transactionDate.getDate() == (date + 1) && transaction.amount < 0)
								.reduce((total, transaction) => total + Math.abs(+transaction.amount.toFixed(2)), 0)
							);
					
					const categories = data.categories
							.map(category => ({
								category: category,
								transactions: transactionsMonthNow.filter(transaction => transaction.category == category),
								total: transactionsMonthNow.filter(transaction => transaction.category == category).reduce((total, transaction) => total += transaction.amount, 0)
							}));
					
					setTransactionCategories(data.categories.sort());
					updateTransactionDisplay(data.transactions);
					setDataSources([...new Set(transactions.map(transaction => transaction.source))]);
					setChartData({
						dailyTotal: [{
								points: dailyNow,
								showStats: true,
								showLabels: true
							}, {
								points: dailyLast,
								showStats: false,
								showLabels: false,
								isDashed: true
							}],
						dailySpending: [{
								points: dailySpendingNow,
								showStats: true,
								showLabels: true,
								isPrimary: true
							},{
								points: dailySpendingLast,
								showStats: false,
								showLabels: false
							}],
						categoriesMonth: categories.map(category => ({ name: category.category || "(uncategorized)", value: category.total }))
					});

				})
				.catch(error => {
					console.warn(error);
					setToastMessage({ text: "Error loading", type: "error" })
				});
		}
	}, []);

	const transactionSearchUpdate = searchValue => {
		setTransactionSearch(searchValue);

		if (searchValue.length > 3 || searchValue.length == 0) {
			fetch(`/finance/api/transactionsget?search=${ searchValue }&page=1`)
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					updateTransactionDisplay(data.transactions);
					setTransactionPage(1);
				})
				.catch(error => {
					console.warn(error);
					setToastMessage({ text: "Error loading", type: "error" })
				});
		}
	};

	const loadPage = pageChange => {
		const newPage = transactionPage + pageChange;

		fetch(`/finance/api/transactionsget?search=${ transactionSearch }&page=${ newPage }`)
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(data => {
				updateTransactionDisplay(data.transactions);
				setTransactionPage(newPage);
			})
			.catch(error => {
				console.warn(error);
				setToastMessage({ text: "Error loading", type: "error" })
			});
	};

	const searchCategory = category => {
		setFilterCategory(category);

		fetch(`/finance/api/transactionsget?category=${ category }&page=1`)
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(data => {
				updateTransactionDisplay(data.transactions);
				setTransactionPage(1);
			})
			.catch(error => {
				console.warn(error);
				setToastMessage({ text: "Error loading", type: "error" })
			});
	};

	const updateTransactionDisplay = transactions => {
		const transactionsUpdated = transactions.map(transaction => ({
			...transaction, 
			descriptionDisplay: transaction.descriptionOverride || transaction.description,
			transactionDate: new Date(transaction.transactionDate) 
		}));

		setTransactions(transactionsUpdated);
		
		setDataCards(dataCards => ({
			...dataCards,
			from: { 
				label: "From", 
				data: transactionsUpdated.length > 0 ? transactionsUpdated.map(transaction => transaction.transactionDate).sort((transactionA, transactionB) => +transactionB - +transactionA).find(() => true).toLocaleDateString() : "--"
			},
			to: {
				label: "To",
				data: transactionsUpdated.length > 0 ? transactionsUpdated.map(transaction => transaction.transactionDate).sort((transactionA, transactionB) => +transactionA - +transactionB).find(() => true).toLocaleDateString() : "--"
			},
			uncategorized: {
				label: "Uncategorized",
				data: transactionsUpdated.filter(transaction => !transaction.category).length
			},
			categories: { 
				label: "Categories", 
				data: [...new Set(transactionsUpdated.filter(transaction => transaction.category).map(transaction => transaction.category))].length
			}
		}));
		
	};

	const exportTransactions = () => {
		fetch(`/finance/api/transactionexport`)
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(data => {
				const headers = '"Transaction Date"\t"Expense Type"\t"isBudget"\t"Category"\t"Amount"\t"Description"',
					fileData = data.transactions.map(transaction => 
						'"' + (new Date(transaction.transactionDate)).toLocaleDateString() + '"\t' +
						'"' + transaction.expenseType + '"\t' +
						(transaction.isBudget ? "true" : "false") + '\t' +
						'"' + transaction.category + '"\t' +
						transaction.amount + '\t' +
						'"' + (transaction.descriptionOverride || transaction.description) + '"'
					).join("\n"),
					output = headers + "\n" + fileData;
				
				const blob = new Blob([output], { type: "text/tab" }),
					url = URL.createObjectURL(blob),
					link = document.createElement("a");
				
				link.href = url;
				link.download = "export.txt";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			})
			.catch(error => {
				console.warn(error);
				setToastMessage({ text: "Error loading", type: "error" })
			});
	};

	const inputDescription = (transactionId, newDescription) => {
		setTransactions(transactions => transactions.map(transaction => ({
			...transaction,
			descriptionOverride: transaction.id == transactionId ? newDescription : transaction.descriptionOverride,
			descriptionDisplay: transaction.id == transactionId ? newDescription : transaction.descriptionDisplay
		})));
	};

	const saveDescription = (transactionId) => {
		const transactionLookup = [...new Set(transactions.filter(transaction => transaction.category).map(transaction => transaction.descriptionDisplay)) ]
			.map(description => ({
				description: description,
				category: transactions.filter(transaction => transaction.descriptionDisplay == description).map(transaction => transaction.category).find(() => true)
			}));

		const updatedTransaction = transactions.find(transaction => transaction.id == transactionId),
			newCategory = transactionLookup.filter(lookup => lookup.description == updatedTransaction.descriptionDisplay).map(lookup => lookup.category).find(() => true);
		
		if (!updatedTransaction.category && newCategory) {
			updatedTransaction.category = newCategory;

			setTransactions(transactions => transactions.map(transaction => transaction.id == transactionId ? updatedTransaction : transaction))	
		}
		
		fetch(`/finance/api/transactionsave`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transaction: updatedTransaction }) })
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(() => {
			})
			.catch(error => {
				console.warn(error);
				setToastMessage({ text: "Error saving transactions", type: "error" })
			});
	};

	const changeCategory = (transactionId, newCategory) => {
		if (newCategory == "*New") {
			setNewCategoryId(transactionId);
		}
		else {
			const updatedTransaction = transactions.filter(transaction => transaction.id == transactionId)
				.map(transaction => ({...transaction, category: newCategory })).find(() => true);

			fetch(`/finance/api/transactionsave`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transaction: updatedTransaction }) })
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(() => {
					
					setTransactions(transactions.map(transaction => ({
						...transaction,
						category: transaction.id == transactionId ? newCategory : transaction.category
					})));

				})
				.catch(error => {
					console.warn(error);
					setToastMessage({ text: "Error saving transactions", type: "error" })
				});
		}
	};

	const updateCategory = isSave => {
		if (isSave) {
			const updatedTransaction = transactions.filter(transaction => transaction.id == newCategoryId)
				.map(transaction => ({...transaction, category: newCategoryInput })).find(() => true);
			
			fetch(`/finance/api/transactionsave`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transaction: updatedTransaction }) })
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(() => {
					
					setTransactions(transactions.map(transaction => ({
						...transaction,
						category: transaction.id == newCategoryId ? newCategoryInput : transaction.category
					})));
					
					setNewCategoryId(null);
					setNewCategoryInput("");
					
				})
				.catch(error => {
					console.warn(error);
					setToastMessage({ text: "Error saving transactions", type: "error" })
				});
		}
		else {
			setNewCategoryId(null);
			setNewCategoryInput("");
		}
	};

	const changeSource = event => {
		if (event.target.value == "new") {
			setShowNewSource(true);
		}
		else {
			setShowNewSource(false);
			setSelectedSource(event.target.value);
		}
	};

	const changeMapping = (sourceIndex, destinationField) => {
		setMappings([
			...mappings.slice(0, sourceIndex),
			destinationField,
			...mappings.slice(sourceIndex + 1)
		]);
	};

	const upload = () => {

		const transactionLookup = [...new Set(transactions.filter(transaction => transaction.category).map(transaction => transaction.description)) ]
			.map(description => ({
				description: description,
				category: transactions.filter(transaction => transaction.description == description).map(transaction => transaction.category).find(() => true)
			}));

		const mappedUpload = fileData.slice(hasHeader ? 1 : 0) // Build a new object for each row
			.map(row => mappings.reduce((output, mapping, index) => 
				mapping ? ({...output, [mapping]: row[index] }) : output, // If the mapping for this index is not blank then add the row data at this index to the array
				{ source: (selectedSource || fileSource) })
			),
			saveUpload = mappedUpload
				.map(transaction => ({
					...transaction, 
					description: transaction.description.replace(/[^-\s]+/g, description => description.charAt(0).toUpperCase() + description.substring(1).toLowerCase())
				}))
				.map(transaction => ({
					...transaction, 
					category: transactionLookup.filter(lookup => lookup.description == transaction.description).map(lookup => lookup.category).find(() => true)
				}));
		
		setSelectedSource("");
		setShowNewSource(false);
		setFileSource("");
		setFileData(null);
		setMappings([]);
		setHasHeader(false);

		fetch(`/finance/api/transactionbulksave`, { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transactions: saveUpload }) })
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				else {
					throw Error(response.statusText);
				}
			})
			.then(() => {
				setToastMessage({ text: "Transactions uploaded", type: "info" })
			})
			.catch(error => {
				console.warn(error);
				setToastMessage({ text: "Error saving transactions", type: "error" })
			});

	};
	
	const selectFile = event => {
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
				let line = getLine(file);

				setMappings(Array.from(Array(line.length).keys()).map((item, itemIndex) => "" ));
				
				while (line.length > 0 && line.join("").trim().length > 0) {
					data.push(line);
					line = getLine(file);
				}

				setFileData(data);
			};

			reader.readAsArrayBuffer(file);
		}
	};

	const getLine = (file) => {
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
				if (line.length == 1 && char == 34) {
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

	return (
<div className="page">

	<div className="nav">
		<div className="menuIconToggle button" onClick={ () => { setIsMenuOpen(!isMenuOpen) }}>
			{/* Hamburger menu */}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
				<path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
			</svg>
		</div>

		<nav className={ isMenuOpen ? "active" : "" }>
			<div className="actions">
				<div className="closeMenu button" onClick={ () => setIsMenuOpen(false) }>
					{/* Close */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
						<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
					</svg>
				</div>
			</div>

			<div className="fixedScroll">
				
				<ul>
				<li role="button" className="button" onClick={ () => setPage("") } aria-label="Home">
					{/* magnifier glass insight */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M400-320q100 0 170-70t70-170q0-100-70-170t-170-70q-100 0-170 70t-70 170q0 100 70 170t170 70Zm-40-120v-280h80v280h-80Zm-140 0v-200h80v200h-80Zm280 0v-160h80v160h-80ZM824-80 597-307q-41 32-91 49.5T400-240q-134 0-227-93T80-560q0-134 93-227t227-93q134 0 227 93t93 227q0 56-17.5 106T653-363l227 227-56 56Z"/></svg>
					<span>Insights</span>
				</li>
				
				<li role="button" className="button" onClick={ () => setPage("transactions") } aria-label="Home">
					{/* list */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z"/></svg>
					<span>Transactions</span>
				</li>
				
				<li role="button" className="button" onClick={ () => setPage("upload") } aria-label="Home">
					{/* cloud upload */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H520q-33 0-56.5-23.5T440-240v-206l-64 62-56-56 160-160 160 160-56 56-64-62v206h220q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h100v80H260Zm220-280Z"/></svg>
					<span>Upload</span>
				</li>
				</ul>
				
			</div>
		</nav>

	</div>

	<div className="content">
		{
		page == "transactions" ?
				
			<div className="paddedContent">
				<h1>Transactions</h1>

				<div className="rowContainer">
				{

					Object.keys(dataCards).map((dataCardName, dataCardIndex) => 
						<div key={dataCardIndex} className="dataCard">
							<div>{ dataCards[dataCardName].label }</div>
							<div>{ dataCards[dataCardName].data }</div>
						</div>
					)
					
				}
				</div>

				<div className="rowContainer">
					<div>
						<input type="text" value={ transactionSearch } placeholder="Search Transactions" onChange={ event => transactionSearchUpdate(event.target.value) } className="searchInput" />
					</div>

					<div>
						<select value={ filterCategory } onChange={ event => searchCategory(event.target.value) } className="filterCategory">
							<option value="">All Categories</option>
							{
							transactionCategories.map((category, categoryIndex) =>
							<option key={categoryIndex} value={category}>{category}</option>
							)
							}
						</select>
					</div>

					<div>
						<label>
							<input type="checkbox" checked={ onlyUncategorized } onChange={ () => setOnlyUncategorized(onlyUncategorized => !onlyUncategorized) } /> 
							Only Uncategorized Transactions
						</label>
					</div>

					<div className="pageNav">
						<button onClick={ () => loadPage(-1) } className="pageButton" disabled={ transactionPage <= 1 }>Prev</button>
						<button onClick={ () => loadPage(1) } className="pageButton">Next</button>
					</div>
				</div>

				<table className="transactionEdit">
				
				<thead>
				<tr>
					<th>Date</th>
					<th>Amount</th>
					<th>Category</th>
					<th>Description</th>
				</tr>
				</thead>

				<tbody>
				{
				transactions
				.filter(transaction => !onlyUncategorized || (onlyUncategorized && !transaction.category))
				.sort((transactionA, transactionB) =>
					transactionA.transactionDate > transactionB.transactionDate ? -1
					: transactionB.transactionDate > transactionA.transactionDate ? 1
					: transactionA.descriptionDisplay > transactionB.descriptionDisplay ? 1
					: transactionA.descriptionDisplay > transactionB.descriptionDisplay ? -1
					: transactionA.id > transactionB.id ? 1
					: -1
				)
				.map((transaction) =>
				
				<tr key={transaction.id}>
					<td>{ transaction.transactionDate.toLocaleDateString() }</td>
					<td>{ +transaction.amount < 0 ? "-$" + Math.abs(+transaction.amount).toFixed(2) : "$" + (+transaction.amount).toFixed(2) }</td>
					<td>
						{
						newCategoryId == transaction.id ?

						<div>
							<input type="text" value={ newCategoryInput } onChange={ event => setNewCategoryInput(event.target.value) } />
							<svg onClick={ () => updateCategory(true) } viewBox="0 -960 960 960"><path d="M389-267 195-460l51-52 143 143 325-324 51 51-376 375Z"/></svg>
							<svg onClick={ () => updateCategory(false) } viewBox="0 -960 960 960"><path d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z"/></svg>
						</div>

						:
						
						<select value={ transaction.category } onChange={ event => changeCategory(transaction.id, event.target.value) }>
							<option value="">-- Select --</option>
							<option value="*New">*New</option>
							{
							transactionCategories.map((category, categoryIndex) =>
								<option key={categoryIndex} value={ category }>{ category }</option>
							)
							}
						</select>

						}
					</td>
					<td>
						<input type="text" value={ transaction.descriptionDisplay } onChange={ event => inputDescription(transaction.id, event.target.value) } onBlur={ () => saveDescription(transaction.id) } />
					</td>
				</tr>
				
				)
				}
				</tbody>
				</table>

				<div className="rowContainer">
					<div className="pageNav">
						<button onClick={ () => loadPage(-1) } className="pageButton" disabled={ transactionPage <= 1 }>Prev</button>
						<button onClick={ () => loadPage(1) } className="pageButton">Next</button>
					</div>
				</div>

			</div>
			
		: page == "upload" ?
			
			<div className="paddedContent">
				<h1>Upload Data</h1>

				<label className="uploadContainer">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
					
					Click to Upload
					<input type="file" onChange={ selectFile } />
				</label>

				<select className="uploadItem" value={ selectedSource } onChange={ changeSource }>
					<option value="">-- Select Source --</option>
					<option value="new">* New</option>
					{
					dataSources.sort().map((source, sourceIndex) => 
						<option key={sourceIndex} value={ source }>{ source }</option>
					)
					}
				</select>

				{
				showNewSource ?
				<label className="uploadItem">
					<input type="text" placeholder="File Source" value={ fileSource } onChange={ event => { setFileSource(event.target.value) } } />
				</label>
				:
				""
				}

				{
				fileData && fileData.length > 0 ?
				<>

				<label className="uploadItem">
					<input type="checkbox" checked={ hasHeader ? true : false } onChange={ event => { setHasHeader(!hasHeader) }} /> First row is a header row?
				</label>

				<div className="tableContainer">
				<table className="fileData">
				<thead>
				<tr>
				
				{
				fileData[0].map((column, columnIndex) => 
					<th key={columnIndex}>
						<select className="dataColumn" value={ mappings[columnIndex] } onChange={ event => { changeMapping(columnIndex, event.target.value) } }>
							<option value="">unmapped</option>
							{
							destinationFields.map((field, fieldIndex) =>
							<option key={fieldIndex} value={ field.field }>{ field.display }</option>
							)
							}
						</select>
					</th>
				)
				}

				</tr>
				</thead>
				<tbody>
				
				{
				fileData.slice(hasHeader ? 1 : 0 ,10).map((row, rowIndex) => 
				<tr key={rowIndex}>
					{
					row.map((column, columnIndex) =>
					<td key={columnIndex}>
						{ column }
					</td>
					)
					}
				</tr>
				)
				}

				</tbody>
				</table>
				</div>
				</>

				: ""
				}

				<button className="uploadButton" disabled={ !fileData || !mappings.some(mapping => mapping) || (!fileSource && !selectedSource) } onClick={ () => upload() }>Upload</button>
			</div>

		:

			<div className="paddedContent">
				<h1>Insights</h1>

				<div className="rowContainer">
					<button className="pageButton" onClick={ () => exportTransactions() }>Export</button>
				</div>

				<div className="insightContainer">
					<LineChart data={ chartData.dailyTotal }></LineChart>
					<BarChart data={ chartData.dailySpending }></BarChart>
					<HistogramChart data={ chartData.categoriesMonth }></HistogramChart>
				</div>
			</div>
		}
	</div>

	<Toast message={ toastMessage } />
</div>
	)

};

ReactDOM.render(<Finance />, document.getElementById("root"));
 export default Finance;
