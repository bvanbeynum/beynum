import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./media/vtp.css";

const VirtualTeamParentComponent = () => {
	
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const handleMessage = (event) => {
			console.log(`origin: ${event.origin}, data: ${JSON.stringify(event.data)}`);
			if (event.origin !== "https://beynum.com") {
				return;
			}
			
			console.log(`data: ${JSON.stringify(event.data)}`);

			if (event.data && event.data.error) {
				setError(event.data.error);
			}
			else if (event.data && event.data.googleName) {
				setUser(event.data);
				setIsLoggedIn(true);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	const openGoogleLogin = () => {
		setError(null);
		window.open("/vtp/auth/google", "Google Login", "width=500,height=600");
	};
		
	return (

		isLoggedIn && user ?

		<div className="dashboard-container">
			<h1>Dashboard</h1>
			<div className="user-info">
				<h2>User Information</h2>
				<p>Name: {user.googleName}</p>
				<p>Email: {user.googleEmail}</p>
			</div>
			<div className="children-list">
				<h2>Children</h2>
				<ul>
					<li>Child 1</li>
					<li>Child 2</li>
				</ul>
			</div>
			<div className="calendar">
				<h2>Calendar</h2>
				<p>Calendar placeholder</p>
			</div>
		</div>

		:

		<div className="login-container">
			<img src="./media/VirtualTeamLogo.png" alt="Virtual Team Parent" className="logo" />
			{error && <div className="error-message">{error}</div>}
			<button onClick={openGoogleLogin} className="login-button">
				Login with Google
			</button>
		</div>

	)
}

ReactDOM.render(<VirtualTeamParentComponent />, document.getElementById("root"));
export default VirtualTeamParentComponent;