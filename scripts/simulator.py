import requests
import time
import math
import json

def currentTime():
	return f"{ math.floor((time.time() - startTime) / 60) } { round((time.time() - startTime) % 60) }s"

def loadResponse(response):
	if not response.ok:
		if response.status_code >= 560:
			errorMessage = response.json()["error"]
			print(f"{ currentTime() }: error: { response.status_code } { errorMessage }")
		else:
			print(f"{ currentTime() }: error: { response.status_code } ")
		
		quit()
	
	return response.json()

startTime = time.time()
gameId = ""
gameDomain = "http://www.beynum.com"  # "http://dev.beynum.com:9201"
gameUrl = f"{ gameDomain }/bj/api/game"
headers = { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IktaT01HQUtKQ1VTRzg3MFdVNkE2IiwiaWF0IjoxNjU0OTUxNTU0fQ.TBSE9zzw-T3lYO8vwxLSCeJg9k3hoC12No1RvBEmGpk" }

print("Starting new game")
game = loadResponse(requests.get(f"{ gameUrl }/new", headers = headers))

while game["settings"]["bank"] - game["settings"]["currentBet"] > 0 and len(game["transactions"]) < 1000:
	game = loadResponse(requests.get(f"{ gameUrl }/deal?state={ game['id'] }", headers = headers))

	while game['settings']['isPlaying']:
		playerDisplay = f"{ game['hands']['player']['value']} [{ ', '.join([ card['card'] for card in game['hands']['player']['cards'] ]) }]"
		dealerCards = game["hands"]["dealer"]["cards"][0]["card"]

		if game["hands"]["split"]:
			splitDisplay = f"{ game['hands']['split']['value'] } [{ ', '.join([ card['card'] for card in game['hands']['split']['cards'] ]) }]"
		else:
			splitDisplay = f"none"

		print(f"{ len(game['transactions']) }: 	{ game['strategy']['display'] } - d: { dealerCards }, p: { playerDisplay }, s: { splitDisplay }")
		
		game = loadResponse(requests.get(f"{ gameUrl }/play?state={ game['id'] }&action={ game['strategy']['display'].lower() }", headers = headers))

	if game["transactions"][-1] > game["transactions"][-2]:
		result = "win"
	elif game["transactions"][-1] < game["transactions"][-2]:
		result = "lost"
	else:
		result = "push"

	print(f"{ len(game['transactions']) - 1 }: { result } b: { game['settings']['bank'] } d: { game['hands']['dealer']['value'] }, p: { game['hands']['player']['value'] }")

	if gameId:
		response = requests.post(f"{ gameDomain }/bj/api/savegametransaction?gameid={ gameId }", headers = headers, json = { "transaction": game["settings"]["bank"] })
	else:
		response = loadResponse(requests.post(f"{ gameDomain }/bj/api/savegame", headers = headers, json = { "game": { "start": game["settings"]["startTime"], "transactions": [ game["settings"]["bank"] ] } }))
		gameId = response["gameid"]
	
print(f"That's enough. { len(game['transactions']) } hands. { game['settings']['bank'] } left")
