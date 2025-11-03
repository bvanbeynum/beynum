import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./media/vtp.css";

const VirtualTeamParentComponent = () => {
	
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const handleMessage = (event) => {
			if (event.origin !== "https://beynum.com") {
				return;
			}
			
			if (event.data && event.data.error) {
				setError(event.data.error);
			}
			else if (event.data && event.data.googleName) {
				setUser(event.data);
				setIsLoggedIn(true);
				
				window.removeEventListener("message", handleMessage);
			}
		};

		// window.addEventListener("message", handleMessage);

		setUser({
			"id": "69091d967ade6be0946fc085",
			"googleName": "Brett van Beynum",
			"googleEmail": "thebeynumco@gmail.com"
		});
		setIsLoggedIn(true);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	const openGoogleLogin = () => {
		setError(null);
		window.open("/vtp/auth/google", "Google Login", "width=700,height=600");
	};

	const coachBroadcast = () => {
	};

	return (

		isLoggedIn && user ?

		<div className="dashboard-container">
			<div className="dashboard-header">
				<img src="./media/VirtualTeamLogo.png" alt="Virtual Team Parent" className="dashboard-logo" />
				<h1 className="dashboard-title">Virtual Team Parent</h1>
			</div>
			<div className="dashboard-grid">
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Process Coach's Email</h2>
					<button onClick={ () => coachBroadcast() } className="dashboard-card-button">Process</button>
				</div>
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Weekly Coach Email</h2>
					<button disabled className="dashboard-card-button">Send</button>
				</div>
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Weekly Parent's Email</h2>
					<button disabled className="dashboard-card-button">Send</button>
				</div>
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Volunteer Email</h2>
					<button disabled className="dashboard-card-button">Send</button>
				</div>
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Request Funds Email</h2>
					<button disabled className="dashboard-card-button">Send</button>
				</div>
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