import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./media/vtp.css";

const VirtualTeamParentComponent = () => {
	
	const [isLoggedIn, setIsLoggedIn] = useState(false);
		
	return (

isLoggedIn ?

<div className="dashboard-container">
	<h1>Dashboard</h1>
	<div className="user-info">
		<h2>User Information</h2>
		<p>Name: John Doe</p>
		<p>Email: john.doe@example.com</p>
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
	<a href="/vtp/auth/google" className="login-button">
		Login with Google
	</a>
</div>

	)
}

ReactDOM.render(<VirtualTeamParentComponent />, document.getElementById("root"));
export default VirtualTeamParentComponent;
