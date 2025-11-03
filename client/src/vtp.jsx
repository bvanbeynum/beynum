import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import "./media/vtp.css";
import logo from "./media/VirtualTeamLogo.png";

function Login() {
	return (
		<div className="login-container">
			<img src={logo} alt="Virtual Team Parent Logo" className="logo" />
			<a href="/vtp/auth/google" className="login-button">
				Login with Google
			</a>
		</div>
	);
}

function Dashboard() {
	return (
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
	);
}

function Vtp() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	return isLoggedIn ? <Dashboard /> : <Login />;
}

const container = document.getElementById("vtp");
const root = createRoot(container);
root.render(<Vtp />);