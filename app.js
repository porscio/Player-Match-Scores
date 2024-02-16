const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())

let db = null

const initialiazeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initialiazeDbAndServer()

const convertPlayerObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
//API-1
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
        SELECT *
        FROM player_details;
    `
  const playerArray = await db.all(getPlayersQuery)
  response.send(
    playerArray.map(eachPlayer =>
      convertPlayerObjectToResponseObject(eachPlayer),
    ),
  )
})
//API-2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id=${playerId};
    `
  const player = await db.get(getPlayerQuery)
  response.send(convertPlayerObjectToResponseObject(player))
})
//API-3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
        UPDATE 
          player_details
        SET 
          player_name = '${playerName}';
        WHERE 
          player_id=${playerId};
    `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

const convertMatchObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
//API-4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
        SELECT *
        FROM match_details
        WHERE match_id=${matchId};
    `
  const match = await db.get(getMatchQuery)
  response.send(convertMatchObjectToResponseObject(match))
})
//API-5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
        SELECT *
        FROM player_match_score
          NATURAL JOIN match_details
        WHERE 
          player_id=${playerId};
    `
  const playerMatch = await db.all(getPlayerMatchesQuery)
  response.send(
    playerMatch.map(eachmatch => convertMatchObjectToResponseObject(eachmatch)),
  )
})
//API-6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerMatchesQuery = `
        SELECT 
          player_match_score.player_id AS playerId,
          player_name AS playerName
        FROM 
          player_details INNER JOIN  player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE 
          match_id=${matchId};
    `
  const playerArray = await db.all(getPlayerMatchesQuery)
  response.send(playerArray)
})
//API-7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScoresQuery = `
        SELECT
          player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(player_match_score.score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
        FROM 
          player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE 
          player_details.player_id=${playerId};
    `
  const playerScores = await db.get(getPlayerScoresQuery)
  response.send(playerScores)
})

module.exports = app
