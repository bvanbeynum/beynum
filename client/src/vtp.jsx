import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./media/vtp.css";

function Vtp() {
	const [view, setView] = useState("login");

	if (view === "login") {
		return (
			<div className="login-container">
				<img src="media/VirtualTeamLogo.png" alt="Virtual Team Parent Logo" className="logo" />
				<h1>Virtual Team Parent</h1>
				<button className="login-button">Login with Google</button>
			</div>
		);
	}

	return (
		<div className="dashboard-container">
			<h1>Dashboard</h1>
		</div>
	);
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Vtp />);