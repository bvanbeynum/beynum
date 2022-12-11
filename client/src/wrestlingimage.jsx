import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/wrestlingimage.css";

class WrestlingImage extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			categoryName: "",
			toast: { message: "", type: "info" }
		};
	};

	componentDidMount() {
		fetch("/wrestling/api/getimage", { method: "post", headers: {"Content-Type": "application/json"} })
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
					imageIndex: data.index,
					categories: data.categories,
					image: { ...data.image, categories: data.image.categories || [] }
				});
			})
			.catch(error => {
				console.warn(error);
				this.setState({ toast: { text: "Error loading data", type: "error" } });
			});
	};

	selectCategory = category => {
		if (this.state.image.categories.includes(category)) {
			this.setState(({ image }) => ({ image: { ...image, categories: image.categories.filter(currentCategory => currentCategory !== category) }}));
		}
		else {
			this.setState(({ image }) => ({ image: { ...image, categories: image.categories.concat(category) }}));
		}
	};

	nextImage = () => {
		this.setState(({ isLoading: true }), () => {
			fetch("/wrestling/api/getimage", { method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ image: this.state.image, index: this.state.imageIndex }) })
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
						categories: data.categories,
						imageIndex: data.index,
						image: { ...data.image, categories: data.image.categories || [] }
					});
				})
				.catch(error => {
					console.warn(error);
					this.setState({ toast: { text: "Error loading data", type: "error" } });
				});
		})
	}

	render() { return (
		<div className="pageContainer">
			
		{
		this.state.isLoading ?
			<div className="loading">
				<img alt="Loading" src="/media/wrestlingloading.gif" />
			</div>
		: 
			<div className="content">
				{
				this.state.image ?
				<img className="imageClassify" src={ this.state.image.url } />
				: ""
				}

				<div className="categoryContainer">
					
					{
					this.state.categories.map((category) => 
					<div key={ category } className={`categoryItem ${ this.state.image.categories.includes(category) ? "selected" : "" }`} onClick={ () => { this.selectCategory(category) } }>
						{category}
					</div>
					)
					}

					<div className="categoryItem" onClick={ () => this.setState(({ showNewCategory }) => ({ showNewCategory: !showNewCategory })) }>
						{
						this.state.showNewCategory ?
						<input type="text" ng-model="newCategory" value={ this.state.categoryName } onChange={ event => this.setState(({ categoryName: event.target.value }))} onBlur={ () => { if (this.state.categoryName) { this.setState(({ categories }) => ({ categories: categories.concat(this.state.categoryName), categoryName: "" })) } }} onClick={ event => { event.stopPropagation(); event.preventDefault() }} />
						:
						<span>New Category</span>
						}
					</div>
					
				</div>

				<div className="nextImage" onClick={ this.nextImage }>{">"}</div>
			</div>
		
		}

		<Toast message={ this.state.toast } />
	</div>
	); }
}

ReactDOM.render(<WrestlingImage />, document.getElementById("root"));
